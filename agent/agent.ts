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

// STEP 1: Welcome the user
console.log(staticMessageMap.welcome);

// STEP 2: provide the context of the conversation
messages.push(promptMap.context());

// STEP 3: Ask and apply the user's query as a task
const userPrompt = await userPromptInterfaceV2(staticMessageMap.you);
messages.push(promptMap.task(userPrompt));

const { browser, page } = await initController();

const taskFlow = async (): Promise<void> => {
  let responseMessage: ResponseMessage = {
    type: ResponseMessageCategory.INITIAL,
    text: "initial",
  };

  //==================================LOOP==================================

  while (shouldContinueLoop(responseMessage)) {
    console.log(`${staticMessageMap.agent}Let me think...`);
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      max_tokens: 1024,
      messages,
      temperature: 0,
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

      // const cleanLinkText = cleanUpTextContent(linkText);

      try {
        const imagePath = await clickNavigationAndScreenshot(
          linkText,
          page,
          browser
        );
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
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("Link with text not found")
        ) {
          console.log(`...Error clicking on link: ${err.message}`);
          messages.push(promptMap.retryIfLinkNotFound(linkText));
          continue;
        } else {
          console.log(`...Unexpected error: ${err}. Please try again.`);
          break;
        }
      }
    }
  }

  const followUpPrompt = await userPromptInterfaceV2(staticMessageMap.you);
  if (followUpPrompt === "" || followUpPrompt.toLowerCase().includes("exit")) {
    console.log(`${staticMessageMap.agent}Goodbye!`);
    return browser.close();
  } else {
    messages.push(promptMap.task(followUpPrompt));
    return taskFlow();
  }
};

await taskFlow();
//==================================LOOP END===============================
