import dotenv from "dotenv";
dotenv.config();
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { isHTMLElement, isValidURL } from "../utils.js";
import { Page } from "puppeteer";

import { highlightInteractiveElements } from "./element-annotator.js";

/**
 * This 10s timeout is the maximum time to wait for the page to load
 */
export const TIMEOUT = 10000;

const imagePath = "./agent/web-agent-screenshot.jpg" as const;

/**
 * This service initializes a new browser session and a new page tab
 * @returns An object containing the browser and the page
 */
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

/**
 * This service takes a screenshot of the given URL
 * @param url
 * @param page
 * @returns A promise that resolves to the path of the screenshot
 */
export const screenshot = async (url: string, page: Page) => {
  if (!isValidURL(url)) {
    throw new Error("Invalid URL");
  }

  console.log(`...Opening ${url}`);

  // TODO: What is the best way to wait for the page to load completely for a screenshot?
  // TODO: currently, we have `waitTillHTMLRendered`, `sleep`, and `waifForEvent` functions
  //  wait 500 ms after the number of active network requests are 2
  await page.goto(url, { waitUntil: "networkidle2", timeout: TIMEOUT });

  console.log(`...Highlight all interactive elements`);
  await highlightInteractiveElements(page);

  try {
    console.log(`...Taking screenshot`);
    await page.screenshot({
      //path: "/agent/web-agent-screenshot.jpg" is a wrong path
      path: imagePath,
      fullPage: true,
    });
    return imagePath;
  } catch (err) {
    console.log(`Error taking screenshot: ${err}`);
  }
};

export const clickOnLink = async (linkText: string, page: Page) => {
  console.log(`...Clicking on link with text: ${linkText}`);

  try {
    const imagePath = await page.evaluate(async (linkText) => {
      const imagePath = "./agent/web-agent-screenshot.jpg";
      const isHTMLElement = (element: Element): element is HTMLElement => {
        return element instanceof HTMLElement;
      };
      const elements = document.querySelectorAll("[gpt-link-text]");

      for (const element of elements) {
        if (!isHTMLElement(element)) {
          return;
        }

        if (element.getAttribute("gpt-link-text")?.includes(linkText)) {
          await Promise.all([page.waitForNavigation(), element.click()]);

          console.log(`...Highlight all interactive elements`);
          await highlightInteractiveElements(page);

          console.log(`...Taking screenshot`);
          await page.screenshot({
            path: imagePath,
            fullPage: true,
          });

          return imagePath;
        } else {
          throw new Error(`Link with text: ${linkText} not found`);
        }
      }
    }, linkText);

    return imagePath;
  } catch (err) {
    console.log(`Error clicking on link: ${err}`);
  }
};
