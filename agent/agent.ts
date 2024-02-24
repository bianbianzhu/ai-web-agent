import dotenv from "dotenv";
dotenv.config();
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import readline from "readline";
import { imageToBase64String, imageToBase64StringV2 } from "./transform.js";
import { sleep } from "./utils.js";
import { highlightInteractiveElements } from "./annotation.js";

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

await page.goto("https://www.amazon.com/");

await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 1 });
