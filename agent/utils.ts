import { Page } from "puppeteer";

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * This function is used to sleep the execution of the program for a given amount of time
 * @param delayMillis - The amount of time to sleep in milliseconds
 */
export const sleep = async (delayMillis: number): Promise<string> => {
  return await new Promise((resolve) =>
    setTimeout(() => {
      resolve(`Waited for ${delayMillis / 1000} seconds`);
      return;
    }, delayMillis)
  );
};

/**
 * Check if the file path is a valid image path that ends with .jpg, .jpeg, or .png (case-insensitive)
 * @param filePath - The file path to check
 * @returns A boolean indicating whether the file path is valid
 */
export const isValidImagePath = (filePath: string): boolean => {
  // Regular expression to match file paths ending with .jpg, .jpeg, or .png
  const regex = /\.(jpg|jpeg|png)$/i;

  // Test the filePath against the regex
  return regex.test(filePath);
};

/**
 * Check if the given string is a valid URL
 * @param txt - The string to check
 * @returns A boolean indicating whether the string is a valid URL
 */
export const isValidURL = (txt: string | undefined) => {
  if (txt === undefined) {
    return false;
  }
  const pattern = new RegExp(
    "^(https?:\\/\\/)" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name and extension
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  );

  return pattern.test(txt);
};

/**
 * This function is used to check if the given string is a valid JSON
 * @param string - The string to check
 * @returns A boolean indicating whether the string is a valid JSON
 */
export const isValidJson = (string: string) => {
  try {
    JSON.parse(string);
  } catch (err) {
    return false;
  }

  return true;
};

/**
 * this function is to check if the given element is visible style wise
 * @param element
 * @returns boolean
 */
export const isElementStyleVisible = (element: Element) => {
  // get the final computed style, including css, inline styles and JS applied styles
  const style = window.getComputedStyle(element);
  // the computed style will also return pixel values for width and height
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    style.width !== "0px" &&
    style.height !== "0px"
  );
};

/**
 * this function is to check if the given element is in the viewport
 * @param element
 * @returns boolean
 */
export const isElementInViewport = (element: Element) => {
  const rect = element.getBoundingClientRect();
  // both innerWidth and documentElement.clientWidth are used to support all browsers
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * This function is to check if the given element is visible to the user
 * @param element
 * @returns boolean
 */
export const isElementVisible = (element: Element | undefined | null) => {
  // if the passed element is null or undefined, throw an error
  if (element === null || element === undefined) {
    throw new Error("isElementVisible: Element is null or undefined");
  }

  let currentElement: Element | null = element;

  // loop through the parent elements (including the element itself) to check if any of them is not visible
  while (currentElement) {
    // early return if the current element is not visible
    if (!isElementStyleVisible(currentElement)) {
      return false;
    }

    currentElement = currentElement.parentElement;
  }

  // loop stops when the currentElement is null (i.e. no more parent elements), @example: button -> div -> body -> html -> null, meaning the button and all its parents are visible, thus the button is visible

  // check if the element is in the viewport; only need to check the element itself, as the position of the parent elements is irrelevant
  return isElementInViewport(element);
};

/**
 * This function is to check if the given element is an HTMLElement
 * @param element
 * @returns boolean
 */
export const isHTMLElement = (element: Element): element is HTMLElement => {
  return element instanceof HTMLElement;
};

/**
 * This function is to replace all the non-alphanumeric characters or spaces in the input text with an empty string.
 * @rule `/[^a-zA-Z0-9 ]/g`
 * @description - This regular expression matches any character that is `not (^)` a `lowercase letter (a-z)`, an `uppercase letter (A-Z)`, a `number (0-9)`, or a `space ( )`.
 * The `g` at the end of the regular expression is a flag that stands for 'global', which means it will replace all matches in the string, not just the first one.
 * @example `cleanUpTextContent("Hello, World!")` returns `"Hello World"`
 * @todo - This function does not support `non-English characters`. These characters will be removed too.
 */
export const cleanUpTextContent = (text: string) =>
  text.replace(/[^a-zA-Z0-9 ]/g, "");

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

export const waitTillHTMLRendered = async (
  page: Page,
  timeout: number = 30000,
  checkOnlyHTMLBody: boolean = false
) => {
  const waitTimeBetweenChecks: number = 1000;
  const maximumChecks: number = timeout / waitTimeBetweenChecks; // assuming check itself does not take time
  let lastHTMLSize = 0;
  let stableSizeCount = 0;
  const COUNT_THRESHOLD = 3;

  const isSizeStable = (currentSize: number, lastSize: number) => {
    if (currentSize !== lastSize) {
      return false; // still rendering
    } else if (currentSize === lastSize && lastSize === 0) {
      return false; // page remains empty - failed to render
    } else {
      return true; // stable
    }
  };

  for (let i = 0; i < maximumChecks; i++) {
    const html = await page.content();
    const currentHTMLSize = html.length;

    const currentBodyHTMLSize = await page.evaluate(
      () => document.body.innerHTML.length
    );

    const currentSize = checkOnlyHTMLBody
      ? currentBodyHTMLSize
      : currentHTMLSize;

    console.log(
      "last: ",
      lastHTMLSize,
      " <> curr: ",
      currentHTMLSize,
      " body html size: ",
      currentBodyHTMLSize
    );

    stableSizeCount = isSizeStable(currentSize, lastHTMLSize)
      ? stableSizeCount + 1 // cannot use stableSizeCount++ because it will return the original value of stableSizeCount
      : 0;

    console.log(`Stable size count: ${stableSizeCount}`);

    if (stableSizeCount >= COUNT_THRESHOLD) {
      console.log("Page rendered fully..");
      break;
    }

    lastHTMLSize = currentSize;
    await page.waitForTimeout(waitTimeBetweenChecks); // remember to await
  }
};

export const isPageExplicitlyLoading = async (page: Page) => {
  const targetClassNames = ["loading", "progress", "spinner", "wait"] as const;
  const selectors = targetClassNames.map(
    (className) =>
      `[class*="${className}"], [class*="${capitalize(
        className
      )}"], [class*="${className.toUpperCase()}"]`
  );

  // document readState can be `complete` while the page is still loading
  return page.evaluate((selectors) => {
    const loadingElement = document.querySelector(selectors.join(", "));

    return (
      document.readyState === "loading" ||
      (loadingElement !== null &&
        (loadingElement as HTMLElement).style.display !== "none")
    );
  }, selectors);
};
