import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { promptMap, staticMessageMap } from "./services/prompt-map.js";
import { userPromptInterfaceV2 } from "./services/user-prompt-interface.js";
import {
  clickNavigationAndScreenshot,
  initController,
  screenshot,
} from "./services/browser-controller.js";

const messages: ChatCompletionMessageParam[] = [];
// STEP 1: Welcome the user and ask for his/her query
console.log(staticMessageMap.welcome);
const userPrompt = await userPromptInterfaceV2(staticMessageMap.you);

// STEP 2: provide the context of the conversation
messages.push(promptMap.context());

// STEP 3: Apply the user's query as a task
messages.push(promptMap.task(userPrompt));

const { browser, page } = await initController();

// Connect to Chrome DevTools
// const client = await page.target().createCDPSession();

// // Set throttling property
// await client.send("Network.emulateNetworkConditions", {
//   offline: false,
//   downloadThroughput: (1024 * 1024) / 8,
//   uploadThroughput: (250 * 1024) / 8,
//   latency: 150,
// });

await screenshot(
  "https://www.officeworks.com.au/shop/officeworks/c/technology",
  page
);

await clickNavigationAndScreenshot("Computers – Apple MacBooks & iMacs", page);
