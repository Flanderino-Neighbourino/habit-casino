import puppeteer from "puppeteer";

const URL = "http://localhost:3003/";

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1024, height: 1400 });

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    errors.push(`[${msg.type()}] ${msg.text()}`);
  }
});
page.on("pageerror", (err) => {
  errors.push(`[pageerror] ${err.message}\n${err.stack ?? ""}`);
});

await page.goto(URL, { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle0" });

async function clickByText(text) {
  const handle = await page.evaluateHandle((t) => {
    return Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === t || b.textContent?.trim().includes(t)
    );
  }, text);
  const el = handle.asElement();
  if (!el) throw new Error(`No button with text "${text}"`);
  await el.click();
}

async function dumpButtons(label) {
  const buttons = await page.evaluate(() =>
    Array.from(document.querySelectorAll("button"))
      .map((b) => b.textContent?.trim().slice(0, 40))
      .filter((t) => t)
  );
  console.log(`buttons @ ${label}:`, buttons);
}

async function fillByPlaceholder(placeholder, value) {
  const handle = await page.evaluateHandle(
    (p) => document.querySelector(`input[placeholder="${p}"]`),
    placeholder
  );
  const el = handle.asElement();
  if (!el) return false;
  await el.click({ clickCount: 3 });
  await el.type(value);
  return true;
}

async function fillAllEmpty() {
  // Fill any text input that's still empty with "X"
  const empties = await page.$$("input[type=text], input:not([type])");
  for (const el of empties) {
    const v = await page.evaluate((n) => n.value, el);
    if (v === "") {
      await el.click({ clickCount: 3 });
      await el.type("X");
    }
  }
}

console.log("=== welcome ===");
await dumpButtons("welcome");
await clickByText("Let's set it up");
await new Promise((r) => setTimeout(r, 300));

console.log("=== names ===");
await dumpButtons("names");
await clickByText("Next");
await new Promise((r) => setTimeout(r, 400));

for (let i = 0; i < 3; i++) {
  console.log(`=== configuring area ${i + 1} ===`);
  // Fill habit name
  await fillByPlaceholder("Habit name (e.g. Burpees)", "Pushups");
  await fillByPlaceholder("unit", "pushups");
  // Fill any other empty text input (reward names, milestone reward names)
  await fillAllEmpty();
  await dumpButtons(`area ${i + 1} pre-next`);
  await clickByText("Next");
  await new Promise((r) => setTimeout(r, 400));
}

console.log("=== done step ===");
await dumpButtons("done");
await page.screenshot({ path: "/tmp/done-step.png" });

try {
  await clickByText("Open the casino");
} catch (e) {
  console.log("CANNOT CLICK 'Open the casino':", e.message);
}
await new Promise((r) => setTimeout(r, 800));

console.log("=== AFTER OPEN ===");
await dumpButtons("after-open");
await page.screenshot({ path: "/tmp/after-open.png" });
const bodyText = await page.evaluate(() => document.body.innerText);
console.log("body length:", bodyText.length);
console.log("body sample:\n", bodyText.slice(0, 600));

console.log("\n=== ERRORS ===");
for (const e of errors) console.log(e);

await browser.close();
