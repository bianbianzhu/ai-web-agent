import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import {
  clickNavigationAndScreenshot,
  initController,
  screenshot,
} from "./services/browser-controller.js";
import { promptMap, staticMessageMap } from "./services/prompt-map.js";
import { userPromptInterfaceV2 } from "./services/user-prompt-interface.js";
import { openai } from "./services/openai.js";
import {
  ResponseMessage,
  ResponseMessageCategory,
  convertTextToResponseMessage,
  imageToBase64String,
  shouldContinueLoop,
} from "./services/data-transformer.js";
import { cleanUpTextContent } from "./utils.js";

const messages: ChatCompletionMessageParam[] = [];
// let hasUrl: boolean = false;
// let hasScreenShotTaken: boolean = false;

// STEP 1: Welcome the user and ask for his/her query
console.log(staticMessageMap.welcome);
const userPrompt = await userPromptInterfaceV2(staticMessageMap.you);

// STEP 2: provide the context of the conversation
messages.push(promptMap.context());

// STEP 3: Apply the user's query as a task
messages.push(promptMap.task(userPrompt));

const taskFlow = async (messages: ChatCompletionMessageParam[]) => {
  let responseMessage: ResponseMessage = {
    type: ResponseMessageCategory.INITIAL,
    text: "initial",
  };
  const { browser, page } = await initController();

  //==================================LOOP==================================

  while (shouldContinueLoop(responseMessage)) {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      max_tokens: 1024,
      messages,
      temperature: 0.2,
    });

    // For the initial conversation, the agent will provide the url (google search if not provided by the user)
    const { message } = response.choices[0];
    const { content: messageText } = message;
    if (messageText === null) {
      throw new Error("The response message text is null");
    }
    console.log(`${staticMessageMap.agent}${messageText}`);

    // Memorize the answer from agent
    messages.push({
      role: "assistant",
      content: messageText,
    });

    responseMessage = convertTextToResponseMessage(messageText);

    if (responseMessage.type === ResponseMessageCategory.URL) {
      const { url } = responseMessage;
      const imagePath = await screenshot(url, page);

      if (imagePath === undefined) {
        throw new Error("The screenshot path is undefined");
      }

      const base64String = await imageToBase64String(imagePath);
      messages.push(
        promptMap.instruction({
          url: base64String,
          detail: "auto",
        })
      );
      continue;
    }

    if (responseMessage.type === ResponseMessageCategory.CLICK) {
      const { linkText } = responseMessage;

      const cleanLinkText = cleanUpTextContent(linkText);

      const imagePath = await clickNavigationAndScreenshot(cleanLinkText, page);

      if (imagePath === undefined) {
        throw new Error("The screenshot path is undefined");
      }

      const base64String = await imageToBase64String(imagePath);
      messages.push(
        promptMap.instruction({
          url: base64String,
          detail: "auto",
        })
      );

      continue;
    }
  }

  await browser.close();
  // need to save the last url in case the flow fires again
};

await taskFlow(messages);
//==================================LOOP END===============================

const followUpPrompt = await userPromptInterfaceV2(staticMessageMap.you);
messages.push(promptMap.task(followUpPrompt));

while (followUpPrompt.includes("continue")) {
  await taskFlow(messages);
}
