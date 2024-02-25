const isElementStyleVisible = (element) => {
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

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

const isElementVisibleChecker = () => {
  let traverseCount = 0;

  return function isElementVisible(element) {
    if ((element === null || element === undefined) && traverseCount === 0) {
      throw new Error(
        "isElementVisible: the passed element is null or undefined"
      );
    } else if (element === null || element === undefined) {
      console.log(
        `Has reached the top of the DOM, ${
          element?.classList[0] ? element?.classList[0] : element?.tagName
        }  is visible`
      );

      return true;
    }

    // traverse up the DOM to check if the any of the parent/ancestor elements are hidden using recursion
    // the break condition is when the current element is not style visible
    let currentElement = element;

    if (!isElementStyleVisible(currentElement)) {
      const { visibility, display, opacity, width, height } =
        window.getComputedStyle(currentElement);

      console.log(
        `element is not visible, checking: "${element?.classList[0]}" with visibility: "${visibility}" and display: "${display}" and opacity: "${opacity}" and width: "${width}" and height: "${height}"`
      );

      return false;
    }

    currentElement = currentElement.parentElement;

    traverseCount++;
    console.log(traverseCount, currentElement);

    isElementVisible(currentElement);
  };
};

//================================================

function isElementVisibleLoop(el) {
  if (!el) return false; // Element does not exist

  // Check if the element is visible style-wise
  if (!isElementStyleVisible(el)) {
    console.log(el.classList[0] + " is not visible");
    return false;
  }

  // Traverse up the DOM and check if any ancestor element is hidden
  let parent = el;
  while (parent) {
    if (!isElementStyleVisible(parent)) {
      console.log(
        `${
          parent.classList[0] ? parent.classList[0] : parent.tagName
        } is not visible`
      );
      return false;
    }
    parent = parent.parentElement;
  }

  console.log(`element is visible: "${el.classList[0]}"`);
  return true;
}

//================================================
const isElementVisibleFail = (element) => {
  // traverse up the DOM to check if the any of the parent/ancestor elements are hidden
  if (element === null || element === undefined) {
    throw new Error("isElementVisible: Element is null or undefined");
  }

  // the break condition is when the current element is null, meaning we have reached the top of the DOM; OR when the current element is not visible
  // The above is wrong, the break condition is when the current element is not visible. If the current element is null, we have reached the top of the DOM and the element should be visible
  let currentElement = element;

  while (currentElement) {
    if (!isElementStyleVisible(currentElement)) {
      console.log(
        `element is not visible, checking: "${
          currentElement.classList[0]
            ? currentElement.classList[0]
            : currentElement.tagName
        }"`
      );
      return false;
    }
    // the below code is the root cause of the issue
    if (currentElement.parentElement === null) {
      console.log(
        `"${
          currentElement.classList[0]
            ? currentElement.classList[0]
            : currentElement.tagName
        } with no parent"`
      );
      return false;
    }

    console.log(
      `${
        currentElement.classList[0]
          ? currentElement.classList[0]
          : currentElement.tagName
      } is visible`
    );

    currentElement = currentElement.parentElement;
  }

  return true;
};

//================================================
const isElementVisibleFix = (element) => {
  if (element === null || element === undefined) {
    throw new Error("isElementVisible: Element is null or undefined");
  }
  let currentElement = element;

  while (currentElement) {
    if (!isElementStyleVisible(currentElement)) {
      return false;
    }

    currentElement = currentElement.parentElement;
  }

  return true;
};

const innerMost = document.querySelector(".inner-most");

// isElementVisibleChecker()(innerMost);

// console.log(isElementVisibleLoop(innerMost));

// console.log(isElementVisibleFail(innerMost));

// console.log(isElementInViewport(innerMost));

const cleanUpTextContent = (text) => text.replace(/[^a-zA-Z0-9 ]/g, "");

// console.log(cleanUpTextContent("Hello, World!"));

// console.log(innerMost.textContent === "");

// document.addEventListener("DOMContentLoaded", () => {
//   console.log("load event");
// });

const URI_PREFIX = "data:image/jpeg;base64,";
const RESPONSE_URL_START_INDICATOR = '{"url":';
const RESPONSE_CLICK_START_INDICATOR = '{"click":';
const RESPONSE_END_INDICATOR = "}";

const isValidJson = (string) => {
  try {
    JSON.parse(string);
  } catch (err) {
    return false;
  }

  return true;
};

const extractContentFromString = (string, type) => {
  if (string === null) {
    throw new Error("extractContentFromString: Invalid string - null");
  }

  if (isValidJson(string)) {
    const parsedObject = JSON.parse(string);
    return type in parsedObject ? parsedObject[type] : null;
  }

  // to resolve potential response message text like 'The url is {"url": "url goes here"}'
  if (string.includes(RESPONSE_URL_START_INDICATOR) && type === "url") {
    return string
      .split(RESPONSE_URL_START_INDICATOR)[1]
      .split(RESPONSE_END_INDICATOR)[0];
  }

  // to resolve potential response message text like 'Click on the link {"click": "Link text"}'
  if (string.includes(RESPONSE_CLICK_START_INDICATOR) && type === "click") {
    return string
      .split(RESPONSE_CLICK_START_INDICATOR)[1]
      .split(RESPONSE_END_INDICATOR)[0];
  }

  return null;
};

const shouldContinueLoop = (responseMessageText) => {
  const isResponseWithURL =
    extractContentFromString(responseMessageText, "url") !== null;
  const isResponseWithLinkText =
    extractContentFromString(responseMessageText, "click") !== null;

  console.log(isResponseWithURL);
  console.log(isResponseWithLinkText);

  if (isResponseWithURL || isResponseWithLinkText) {
    return true;
  }

  if (responseMessageText === "initial message") {
    return true;
  }

  return false;
};

console.log(shouldContinueLoop('This is {"url": '));
