import puppeteer from "puppeteer";

const URL = "http://localhost:3003/";
const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") errors.push(`[${m.type()}] ${m.text()}`);
});
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack ?? ""}`));

await page.goto(URL, { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle0" });

async function clickByText(text) {
  const handle = await page.evaluateHandle(
    (t) => Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.trim().includes(t)),
    text
  );
  await handle.asElement().click();
}
async function fillByPlaceholder(p, v) {
  const h = await page.evaluateHandle((sel) => document.querySelector(`input[placeholder="${sel}"]`), p);
  const el = h.asElement();
  if (!el) return false;
  await el.click({ clickCount: 3 });
  await el.type(v);
  return true;
}
async function fillAllEmpty() {
  const empties = await page.$$("input");
  for (const el of empties) {
    const t = await page.evaluate((n) => n.type, el);
    if (t === "number") continue;
    const v = await page.evaluate((n) => n.value, el);
    if (v === "") {
      await el.click({ clickCount: 3 });
      await el.type("X");
    }
  }
}

await clickByText("Let's set it up");
await new Promise((r) => setTimeout(r, 200));
await clickByText("Next");
await new Promise((r) => setTimeout(r, 300));

for (let i = 0; i < 3; i++) {
  await fillByPlaceholder("Habit name (e.g. Burpees)", "Pushups");
  await fillByPlaceholder("unit", "pushups");
  await fillAllEmpty();
  await clickByText("Next");
  await new Promise((r) => setTimeout(r, 300));
}

await clickByText("Open the casino");
await new Promise((r) => setTimeout(r, 800));

await page.screenshot({ path: "/tmp/mobile-after.png", fullPage: true });
const text = await page.evaluate(() => document.body.innerText);
console.log("body length:", text.length);
console.log("body sample:", text.slice(0, 300));
console.log("ERRORS:", errors);
await browser.close();
