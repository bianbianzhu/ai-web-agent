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

await screenshot(
  "https://www.google.com/search?q=good+fictional+movies+about+mars",
  page
);

await clickNavigationAndScreenshot("Set Me Free", page);
