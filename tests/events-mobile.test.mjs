import { execSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import puppeteer from "puppeteer-core";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 8794;

function chromePath() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  for (const bin of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    try {
      const found = execSync(`command -v ${bin}`, { encoding: "utf8" }).trim();
      if (found) return found;
    } catch {
      // Try the next binary.
    }
  }
  return null;
}

const chrome = chromePath();
let server;
let browser;

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/pages/events.html`);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("The events page server did not start.");
}

async function openArchive(page, sectionId) {
  const summary = await page.$(`#${sectionId} > summary`);
  await summary.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForFunction((id) => {
    const rect = document.querySelector(`#${id} > summary`).getBoundingClientRect();
    return rect.top > 80 && rect.bottom < window.innerHeight - 80;
  }, {}, sectionId);
  const coveredBy = await summary.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    if (target === element || element.contains(target)) return "";
    return target ? `${target.tagName}.${target.className}` : "nothing";
  });
  expect(coveredBy).toBe("");
  await summary.tap();
  return page.evaluate((id) => {
    const section = document.getElementById(id);
    const card = section.querySelector(".story-card");
    const rect = card.getBoundingClientRect();
    return {
      open: section.open,
      visible: rect.height > 20 && getComputedStyle(card).display !== "none" && !card.hidden
    };
  }, sectionId);
}

describe.skipIf(!chrome)("events page on a phone", () => {
  afterAll(async () => {
    await browser?.close();
    server?.kill();
  });

  it("opens past events and earlier news when the summary is tapped", async () => {
    server = spawn("npx", ["http-server", "-p", String(port), "-c-1", "--silent"], { cwd: rootDir, stdio: "ignore" });
    await waitForServer();
    browser = await puppeteer.launch({
      executablePath: chrome,
      headless: true,
      args: ["--no-sandbox", "--disable-gpu"]
    });
    const page = await browser.newPage();
    await page.emulate({
      viewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    });
    await page.goto(`http://127.0.0.1:${port}/pages/events.html`, { waitUntil: "networkidle0" });
    const accept = await page.$("[data-cc-accept]");
    if (accept) await accept.click();
    const past = await openArchive(page, "past-events-section");
    const news = await openArchive(page, "news-archive");
    expect(past).toEqual({ open: true, visible: true });
    expect(news).toEqual({ open: true, visible: true });
  }, 30000);
});
