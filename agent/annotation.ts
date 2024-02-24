import { Page } from "puppeteer";

const UNIQUE_IDENTIFIER_ATTRIBUTE = "gpt-link-text";

const INTERACTIVE_ELEMENTS = [
  "a",
  "button",
  "input",
  "textarea",
  "[role=button]",
  "[role=treeitem]",
];

/**
 * TODO: Reset the unique identifier attribute and remove previously highlighted elements
 * @param page
 */
const resetUniqueIdentifierAttribute = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    const UNIQUE_IDENTIFIER_ATTRIBUTE = "gpt-link-text";
    const elements = document.querySelectorAll(
      `[${UNIQUE_IDENTIFIER_ATTRIBUTE}]`
    );
    for (const element of elements) {
      element.removeAttribute(UNIQUE_IDENTIFIER_ATTRIBUTE);
    }
  });
};

export const outlineAllInteractiveElements = async (page: Page) => {
  // $$eval method runs Array.from(document.querySelectorAll(selector)) within the `page`and passes the result as the first argument to the pageFunction.
  // If no elements match the selector, the first argument to the pageFunction is [].
  await page.$$eval(
    INTERACTIVE_ELEMENTS.join(", "),
    // the argument `elements` can be an empty array if no elements match the selector
    function (elements) {
      // any console.log will not be visible in the node terminal
      // instead, it will be visible in the browser console

      // handle empty array
      if (elements.length === 0) {
        throw new Error("No elements found");
      }

      // This run-time check must be defined inside the pageFunction as it is running in the browser context. If defined outside, it will throw an error: "ReferenceError: isHTMLElement is not defined"
      const isHTMLElement = (element: Element): element is HTMLElement => {
        return element instanceof HTMLElement;
      };

      // copy paste the function from the utils.ts file as they are not accessible in the browser context if they are not defined inside the pageFunction
      const isElementStyleVisible = (element: Element) => {
        const style = window.getComputedStyle(element);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0" &&
          style.width !== "0px" &&
          style.height !== "0px"
        );
      };

      const isElementInViewport = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <=
            (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <=
            (window.innerWidth || document.documentElement.clientWidth)
        );
      };

      const isElementVisible = (element: Element | undefined | null) => {
        if (element === null || element === undefined) {
          throw new Error("isElementVisible: Element is null or undefined");
        }

        let currentElement: Element | null = element;
        while (currentElement) {
          if (!isElementStyleVisible(currentElement)) {
            return false;
          }

          currentElement = currentElement.parentElement;
        }
        return isElementInViewport(element);
      };

      // clean up the input text by removing any characters that are not alphanumeric (letters and numbers) or spaces.
      const cleanUpTextContent = (text: string) =>
        text.replace(/[^a-zA-Z0-9 ]/g, "");

      // highlight all the interactive elements with a red bonding box
      elements.forEach((element) => {
        if (isHTMLElement(element) && isElementVisible(element)) {
          element.style.outline = "2px solid red";

          // set a unique identifier attribute to the element
          // this attribute will be used to identify the element that puppeteer should interact with
          const { textContent, tagName, classList } = element;
          let linkText: string | undefined;

          if (textContent === null) {
            return;
          }

          const UNIQUE_IDENTIFIER_ATTRIBUTE = "gpt-link-text";

          linkText =
            textContent.trim() === ""
              ? `${tagName}-${crypto.randomUUID()}`
              : cleanUpTextContent(textContent).trim();

          element.setAttribute(UNIQUE_IDENTIFIER_ATTRIBUTE, linkText);
        }
      });
    }
  );
};

/**
 * This function highlights all the interactive elements on the page
 * @param page
 */
export const highlightInteractiveElements = async (page: Page) => {
  await resetUniqueIdentifierAttribute(page);
  await outlineAllInteractiveElements(page);
};
