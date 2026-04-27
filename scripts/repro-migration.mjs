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

// Visit, then plant v1-shaped data, then reload
await page.goto(URL, { waitUntil: "networkidle0" });

const v1State = {
  onboardingComplete: true,
  schemaVersion: 1,
  history: [],
  pendingBonusQueue: [],
  areas: [
    {
      id: "a1",
      name: "Fitness",
      habits: [
        { id: "h1", name: "Burpees", effortNumber: 15, effortUnit: "burpees" },
        { id: "h2", name: "Stretching", effortNumber: 5, effortUnit: "minutes" },
      ],
      rewards: {
        t1: { name: "Netflix", amountNumber: 1, amountUnit: "episodes" },
        t2: { name: "Coffee", amountNumber: 1, amountUnit: "pieces" },
        t3: { name: "Movie", amountNumber: 1, amountUnit: "hours" },
        jackpot: { name: "Day off", amountNumber: 1, amountUnit: "hours" },
      },
      milestones: [
        { target: 25, rewardName: "Massage" },
        { target: 75, rewardName: "Trainer" },
        { target: 200, rewardName: "Bike" },
      ],
      bank: [{ id: "c1", color: "red", habitId: "h1", earnedAt: new Date().toISOString() }],
      jar: [],
      dailyState: { date: "2026-04-26", completedHabitIds: ["h1"] },
    },
    {
      id: "a2",
      name: "Career",
      habits: [{ id: "h3", name: "Code", effortNumber: 30, effortUnit: "minutes" }],
      rewards: {
        t1: { name: "X", amountNumber: 1, amountUnit: "minutes" },
        t2: { name: "X", amountNumber: 1, amountUnit: "minutes" },
        t3: { name: "X", amountNumber: 1, amountUnit: "minutes" },
        jackpot: { name: "X", amountNumber: 1, amountUnit: "minutes" },
      },
      milestones: [
        { target: 10, rewardName: "X" },
        { target: 20, rewardName: "X" },
        { target: 30, rewardName: "X" },
      ],
      bank: [],
      jar: [],
      dailyState: { date: "2026-04-26", completedHabitIds: [] },
    },
    {
      id: "a3",
      name: "Music",
      habits: [{ id: "h4", name: "Practice", effortNumber: 20, effortUnit: "minutes" }],
      rewards: {
        t1: { name: "X", amountNumber: 1, amountUnit: "minutes" },
        t2: { name: "X", amountNumber: 1, amountUnit: "minutes" },
        t3: { name: "X", amountNumber: 1, amountUnit: "minutes" },
        jackpot: { name: "X", amountNumber: 1, amountUnit: "minutes" },
      },
      milestones: [
        { target: 10, rewardName: "X" },
        { target: 20, rewardName: "X" },
        { target: 30, rewardName: "X" },
      ],
      bank: [],
      jar: [],
      dailyState: { date: "2026-04-26", completedHabitIds: [] },
    },
  ],
};

await page.evaluate((s) => {
  localStorage.setItem("habitCasino", JSON.stringify(s));
}, v1State);

await page.reload({ waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 800));

const bodyText = await page.evaluate(() => document.body.innerText);
console.log("body length:", bodyText.length);
console.log("body:\n", bodyText.slice(0, 800));

const stored = await page.evaluate(() => localStorage.getItem("habitCasino"));
const parsed = JSON.parse(stored);
console.log("\nschemaVersion after load:", parsed.schemaVersion);
console.log("first habit:", parsed.areas[0].habits[0]);
console.log("first dailyState:", parsed.areas[0].dailyState);

console.log("\n=== ERRORS ===");
for (const e of errors) console.log(e);

await browser.close();
