import {
  ChatCompletionContentPartImage,
  ChatCompletionMessageParam,
} from "openai/resources/index.mjs";

export const WELCOME_MESSAGE = `Hi, How can I help you today?`;

// TODO: what is the best way to define the type of the promptMap?
export const promptMap = {
  context: (): ChatCompletionMessageParam => ({
    role: "system",
    content: `You are a website crawler. You will be given instructions on what to do by browsing. You are connected to a web browser and you will be given the screenshot of the website you are on. The links on the website will be highlighted in red in the screenshot. Always read what is in the screenshot. Don't guess link names.

        You can go to a specific URL by answering with the following JSON format:
        {"url": "url goes here"}

        You can click links on the website by referencing the text inside of the link/button, by answering in the following JSON format:
        {"click": "Text in link"}

        Once you are on a URL and you have found the answer to the user's question, you can answer with a regular message.

        Use google search by set a sub-page like 'https://google.com/search?q=search' if applicable. Prefer to use Google for simple queries. If the user provides a direct URL, go to that one. Do not make up links`,
  }),
  instruction: (
    image_url: ChatCompletionContentPartImage.ImageURL
  ): ChatCompletionMessageParam => ({
    role: "user",
    content: [
      {
        type: "image_url",
        image_url,
      },
      {
        type: "text",
        text: 'Here\'s the screenshot of the website you are on right now. You can click on links with {"click": "Link text"} or you can crawl to another URL if this one is incorrect. If you find the answer to the user\'s question, you can respond normally.',
      },
    ],
  }),
  question: (userInterfacePrompt: string): ChatCompletionMessageParam => ({
    role: "user",
    content: userInterfacePrompt,
  }),
};
