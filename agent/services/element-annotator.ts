import { Page } from "puppeteer";

// for reference, this variable must be defined in the browser context (inside the pageFunction)
// const UNIQUE_IDENTIFIER_ATTRIBUTE = "gpt-link-text";

const INTERACTIVE_ELEMENTS = [
  "a",
  "button",
  /** to avoid clicking on the google search input */
  // "input",
  // "textarea",
  "[role=button]",
  "[role=treeitem]",
  '[onclick]:not([onclick=""])',
];

/**
 * Reset the unique identifier attribute and remove previously highlighted elements
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

/**
 * This function annotates all the interactive elements on the page
 * @param page
 */
const annotateAllInteractiveElements = async (page: Page) => {
  // $$eval method runs Array.from(document.querySelectorAll(selector)) within the `page`and passes the result as the first argument to the pageFunction.
  // If no elements match the selector, the first argument to the pageFunction is [].
  await page.$$eval(
    INTERACTIVE_ELEMENTS.join(", "), // the selector can be defined outside the browser context

    // the argument `elements` can be an empty array if no elements match the selector
    function (elements) {
      // any console.log inside the callback will not be visible in the node terminal
      // instead, it will be visible in the browser console

      // handle empty array
      if (elements.length === 0) {
        throw new Error("No elements found");
      }

      //======================================VALIDATE ELEMENT CAN INTERACT=================================================
      // This run-time check must be defined inside the pageFunction as it is running in the browser context. If defined outside, it will throw an error: "ReferenceError: isHTMLElement is not defined"
      const isHTMLElement = (element: Element): element is HTMLElement => {
        // this assertion is to allow Element to be treated as HTMLElement and has `style` property
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
        // return isElementInViewport(element); //disable the inViewport check for now
        return true;
      };

      //========================================PREPARE UNIQUE IDENTIFIER================================================

      // clean up the text by removing any characters that are not alphanumeric (letters and numbers) or spaces.
      // Does not support non-English characters; Set the language of the page to English to avoid issues
      const cleanUpTextContent = (text: string) =>
        text.replace(/[^a-zA-Z0-9 ]/g, "");

      const setUniqueIdentifierBasedOnTextContent = (element: Element) => {
        const UNIQUE_IDENTIFIER_ATTRIBUTE = "gpt-link-text";
        const { textContent, tagName } = element;
        // if the node is a document or doctype, textContent will be null
        if (textContent === null) {
          return;
        }

        //TODO: <a title="MacBook Air 15&quot; M3 8-Core CPU 10-Core GPU 8/256GB Starlight"></a> This a link does not have textContent, but it has a title attribute. The title attribute can be used as the unique identifier

        // there is no way for the llm to point a element without textContent, like a button with an icon (assumably), the following logic is disabled for now
        // const linkText =
        //   textContent.trim() === ""
        //     ? `${tagName}-${crypto.randomUUID()}`
        //     : cleanUpTextContent(textContent).trim();

        element.setAttribute(
          UNIQUE_IDENTIFIER_ATTRIBUTE,
          textContent.trim().toLowerCase()
        );
      };

      //========================================HIGHLIGHT INTERACTIVE ELEMENTS================================================
      for (const element of elements) {
        if (isHTMLElement(element)) {
          // highlight all the interactive elements with a red bonding box
          element.style.outline = "2px solid red";
        }

        if (isElementVisible(element)) {
          // set a unique identifier attribute to the element
          // this attribute will be used to identify the element that puppeteer should interact with
          setUniqueIdentifierBasedOnTextContent(element);
        }
      }
    }
  );
};

/**
 * This function highlights all the interactive elements on the page
 * @param page
 */
export const highlightInteractiveElements = async (page: Page) => {
  await resetUniqueIdentifierAttribute(page);
  await annotateAllInteractiveElements(page);
};
