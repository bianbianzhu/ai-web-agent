import dotenv from "dotenv";
dotenv.config();
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { isValidURL } from "../utils.js";
import { Page } from "puppeteer";
import { TIMEOUT } from "../agent.js";
import { highlightInteractiveElements } from "./element-annotator.js";

/**
 * This function is used to wait for a specific event to occur on the page
 * @param page
 * @param eventType
 */
export const waitForEvent = async (
  page: Page,
  eventType: keyof DocumentEventMap
) => {
  // remember, all variables declared in the node context are not accessible in the browser context. However, you can pass them as arguments to the pageFunction - The 2nd argument which is after the pageFunction. In this case, we are passing the eventType; otherwise, Error [ReferenceError]: eventType is not defined
  return page.evaluate(
    (eventType) =>
      new Promise<string>((resolve) => {
        document.addEventListener(eventType, () => {
          resolve(`Event: ${eventType} occurred`);
          return;
        });
      }),
    eventType
  );
};

export const initController = async () => {
  const pup = puppeteer.default.use(StealthPlugin());
  const browser = await pup.launch({
    headless: false,
    executablePath: process.env.GOOGLE_CHROME_CANARY_PATH,
    userDataDir: process.env.GOOGLE_CHROME_CANARY_USER_DATA_DIR,
    args: [
      `--profile-directory=${process.env.PROFILE}`,
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--no-zygote",
    ],
  });

  const page = await browser.newPage();

  await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 1 });

  return { browser, page };
};

export const screenshot = async (url: string, page: Page) => {
  if (!isValidURL(url)) {
    throw new Error("Invalid URL");
  }

  console.log(`...Opening ${url}`);

  //  wait 500 ms after the number of active network requests are 2
  await page.goto(url, { waitUntil: "networkidle2", timeout: TIMEOUT });

  console.log(`...Highlight all interactive elements`);
  await highlightInteractiveElements(page);

  console.log(`...Taking screenshot`);
  await page.screenshot({
    //path: "/agent/web-agent-screenshot.jpg" is a wrong path
    path: "./agent/web-agent-screenshot.jpg",
    fullPage: true,
  });
};
