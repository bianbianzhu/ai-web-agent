import dotenv from "dotenv";
dotenv.config();
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {
  isPageExplicitlyLoading,
  isValidURL,
  waitTillHTMLRendered,
} from "../utils.js";
import { Browser, Page } from "puppeteer";
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
  try {
    // TODO: What is the best way to wait for the page to load completely for a screenshot?
    // TODO: currently, we have `waitTillHTMLRendered`, `sleep`, and `waifForEvent` functions
    //  wait 500 ms after the number of active network requests are 2
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: TIMEOUT,
    });

    // waitUntil is not enough to wait for the page to load completely, so we need extra logic to wait for the page to load
    const imagePath = await waitAndScreenshot(page);
    return imagePath;
  } catch (err) {
    console.log(`Error taking screenshot: ${err}`);
  }
};

export const clickNavigationAndScreenshot = async (
  linkText: string,
  page: Page,
  browser: Browser
) => {
  let imagePath;
  try {
    // To use a if statement to check if the link opens in a new tab, Promise.all cannot be used
    // await Promise.all([page.waitForNavigation(), clickOnLink(linkText, page)]);

    // change to this:
    const navigationPromise = page.waitForNavigation();
    const clickResponse = await clickOnLink(linkText, page);
    if (!clickResponse) {
      await navigationPromise;
      imagePath = await waitAndScreenshot(page);
    } else {
      // if the link opens in a new tab, ignore the navigationPromise as there won't be any navigation
      // MUST NOT USE `AWAIT` HERE, otherwise it will wait the default timeout of 30s
      navigationPromise.catch(() => undefined);
      const newPage = await newTabNavigation(clickResponse, page, browser);

      if (newPage === undefined) {
        throw new Error("The new page cannot be opened");
      }

      imagePath = await waitAndScreenshot(newPage);
    }

    return imagePath;
  } catch (err) {
    throw err;
  }
};

const clickOnLink = async (linkText: string, page: Page) => {
  try {
    const clickResponse = await page.evaluate(async (linkText) => {
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
            ?.includes(linkText.trim().toLowerCase()) // align with `setUniqueIdentifierAttribute` in `element-annotator.ts`
        ) {
          if (element.getAttribute("target") === "_blank") {
            return element.getAttribute("gpt-link-text");
          }

          element.style.backgroundColor = "rgba(255,255,0,0.25)";
          element.click();
          return;
        }
      }

      // only if the loop ends without returning
      throw new Error(`Link with text not found: "${linkText}"`);
    }, linkText);

    return clickResponse;
  } catch (err) {
    // console.log(`Error clicking on link: ${err}`);
    if (err instanceof Error) {
      // must rethrow the error so that it can be caught in the calling function
      throw err;
    }
  }
};

const newTabNavigation = async (
  gptLinkText: string,
  page: Page,
  browser: Browser
) => {
  try {
    // store the target of original page to know that this was the opener:
    const currentPageTarget = page.target();

    // execute click on the current page that triggers opening of new tab (new page):
    const element = await page.$(`[gpt-link-text="${gptLinkText}"]`);

    if (element === null) {
      throw new Error("The element is null");
    }

    element.click();

    // check if the new page is opened by the current page:
    const newPageTarget = await browser.waitForTarget(
      (target) => target.opener() === currentPageTarget
    );

    // switch to the new page:
    const newPage = await newPageTarget.page();

    if (newPage === null) {
      throw new Error("The new page is null");
    }

    // wait for page to be loaded (briefly)
    await newPage.waitForSelector("body");

    return newPage;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
  }
};

const waitAndScreenshot = async (page: Page) => {
  // waitUntil in `GoToOptions` is not enough to wait for the page to load completely (especially with dynamic loading content), so we need to use waitTillHTMLRendered
  const isLoading = await isPageExplicitlyLoading(page);

  isLoading && (await waitTillHTMLRendered(page));

  console.log(`...Highlight all interactive elements`);
  await highlightInteractiveElements(page);

  console.log(`...Taking screenshot`);
  await page.screenshot({
    //path: "/agent/web-agent-screenshot.jpg" is a wrong path
    path: imagePath,
    fullPage: true,
  });

  return imagePath;
};
