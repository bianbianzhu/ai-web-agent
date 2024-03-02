import dotenv from "dotenv";
dotenv.config();
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {
  isPageExplicitlyLoading,
  isValidURL,
  waitTillHTMLRendered,
} from "../utils.js";
import { Page } from "puppeteer";
import { highlightInteractiveElements } from "./element-annotator.js";

/**
 * This 10s timeout is the maximum time to wait for the page to load
 */
export const TIMEOUT = 15000;

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
  console.log(`...Opening ${url}`);
  if (!isValidURL(url)) {
    throw new Error(`Invalid URL: ${url}`);
  }

  // TODO: What is the best way to wait for the page to load completely for a screenshot?
  // TODO: currently, we have `waitTillHTMLRendered`, `sleep`, and `waifForEvent` functions
  //  wait 500 ms after the number of active network requests are 2
  await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: TIMEOUT,
  });

  // waitUntil is not enough to wait for the page to load completely, so we need to use waitTillHTMLRendered
  const isLoading = await isPageExplicitlyLoading(page);

  isLoading && (await waitTillHTMLRendered(page));

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

const clickOnLink = async (linkText: string, page: Page) => {
  try {
    await page.evaluate(async (linkText) => {
      const isHTMLElement = (element: Element): element is HTMLElement => {
        return element instanceof HTMLElement;
      };
      const elements = document.querySelectorAll("[gpt-link-text]");

      for (const element of elements) {
        if (!isHTMLElement(element)) {
          continue;
        }

        if (
          element
            .getAttribute("gpt-link-text")
            ?.includes(linkText.toLowerCase())
        ) {
          element.style.backgroundColor = "rgba(255,255,0,0.25)";
          element.click();
          return;
        }
      }

      // only if the loop ends without returning
      throw new Error(`Link with text not found: "${linkText}" `);
    }, linkText);
  } catch (err) {
    // console.log(`Error clicking on link: ${err}`);
    if (err instanceof Error) {
      // must rethrow the error so that it can be caught in the calling function
      throw err;
    }
  }
};

export const clickNavigationAndScreenshot = async (
  linkText: string,
  page: Page
) => {
  try {
    await Promise.all([page.waitForNavigation(), clickOnLink(linkText, page)]);

    const isLoading = await isPageExplicitlyLoading(page);

    isLoading && (await waitTillHTMLRendered(page));

    console.log(`...Highlight all interactive elements`);
    await highlightInteractiveElements(page);

    console.log(`...Taking screenshot`);
    await page.screenshot({
      path: imagePath,
      fullPage: true,
    });

    return imagePath;
  } catch (err) {
    console.log(`Error navigating and taking screenshot: ${err}`);
  }
};
