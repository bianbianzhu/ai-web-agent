import dotenv from "dotenv";
dotenv.config();
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import readline from "readline";
import { imageToBase64String, imageToBase64StringV2 } from "./transform.js";
import { sleep } from "./utils.js";

const pup = puppeteer.default.use(StealthPlugin());

const result = await imageToBase64StringV2("screenshot.jpg");

console.log(result);
