/**
 * This function is used to sleep the execution of the program for a given amount of time
 * @param delay - The amount of time to sleep in milliseconds
 */
export const sleep = async (delay: number): Promise<void> => {
  return await new Promise((resolve) => setTimeout(resolve, delay));
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
