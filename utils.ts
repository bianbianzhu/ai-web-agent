import { Page } from "puppeteer";

enum ChromeBrowser {
  Default = "default",
  Canary = "canary",
  Testing = "testing",
}

/**
 * By default, which executablePath of puppeteer.launch is not set
 * it will use the bundled Test version of Chromium
 * We prefer to use Chrome Canary for development
 * @returns the path to the chrome executable
 */
export const chromePath = () => {
  // process.argv.......................[0 nodemon][1 filename][2 chrome][3 url]
  // the node script command should be like `yarn dev screenshot.ts canary url`

  // if the user doesn't specify which browser to use, it will default to the Canary
  if (process.argv.length < 3) {
    return process.env.GOOGLE_CHROME_CANARY_PATH;
  }

  switch (process.argv[2]) {
    case ChromeBrowser.Default:
      return process.env.GOOGLE_CHROME_PATH;
    case ChromeBrowser.Testing:
      return undefined;
    default:
      return process.env.GOOGLE_CHROME_CANARY_PATH;
  }
};

export const validateURL = (txt: string | undefined) => {
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
