import dotenv from "dotenv";
dotenv.config();
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { chromePath, validateURL } from "./utils.js";

// why must use puppeteer.default?
const pup = puppeteer.default.use(StealthPlugin());

const TEST_URL =
  "https://www.royalnavy.mod.uk/qhm/portsmouth/shipping-movements"; // this is a test URL for testing the stealth plugin
const TIMEOUT = 10000;
const WAIT_TIME = 800;

/**
 * The URL to take a screenshot of can be passed as an argument
 * The 4th argument is the URL
 * However, if the 3rd argument (the chrome path) is not passed and instead the 3rd argument is the URL, then the URL will be the 3rd argument. The chrome will be Canary by default
 */
const url =
  process.argv[3] ||
  (validateURL(process.argv[2]) && process.argv[2]) ||
  TEST_URL;

const screenshot = async () => {
  try {
    // 1. Launch a new browser session
    const browser = await pup.launch({
      // Determines whether to run the browser in headless mode (without a GUI). true/false/'new' (same as true but also starts the browser in a new X session)
      headless: false,
      // path to a browser executable to use instead of the bundled Chromium
      executablePath: chromePath(),
      // path to a user data directory, i.e. the user profile directory
      userDataDir: process.env.GOOGLE_CHROME_CANARY_USER_DATA_DIR, // this is the path to your chrome profile, you can find profile(s), like Profile 1, Profile 2, and etc. in this directory
      args: [
        `--profile-directory=${process.env.PROFILE}`, //Select ONE of your profile here
        "--disable-setuid-sandbox", // the following flags for running in a docker container
        "--no-sandbox",
        "--no-zygote",
      ],
    });

    // 2. Create a new page tab
    const page = await browser.newPage();

    // 3. set viewport
    await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 1 });

    // 4. Go to the URL
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT,
    });

    // 5. Wait for the page to load
    await page.waitForTimeout(WAIT_TIME);

    // 6. Take a screenshot
    await page.screenshot({ path: "screenshot.jpg", fullPage: true });
    console.log("Screenshot taken");

    // 7. Close the browser
    await browser.close();
  } catch (err) {
    console.log("Error running puppeteer: ", err);
  }
};

screenshot();
