import dotenv from "dotenv";
dotenv.config();
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const pup = puppeteer.default.use(StealthPlugin());

const init = async () => {
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

  await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 1 });

  return { browser, page };
};

const { browser, page } = await init();

await page.goto("https://www.amazon.com");
