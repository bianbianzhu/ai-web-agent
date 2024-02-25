import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import {
  initController,
  screenshot,
  waitForEvent,
} from "./services/browser-controller.js";
import { promptMap, staticMessageMap } from "./services/prompt-map.js";
import { userPromptInterfaceV2 } from "./services/user-prompt-interface.js";
import { openai } from "./services/openai.js";

export const TIMEOUT = 10000;
const messages: ChatCompletionMessageParam[] = [];

console.log(staticMessageMap.welcome);
const userPrompt = await userPromptInterfaceV2(staticMessageMap.you);

messages.push(promptMap.task(userPrompt));

const { browser, page } = await initController();

await screenshot(
  (messages[0].content as any) ||
    "https://www.alibaba.com/onesight/product.html?biz=trademark&src=sem_ggl&field=UG&from=sem_ggl&cmpgn=20530084703&adgrp=161808297108&fditm=&tgt=kwd-932673495827&locintrst=&locphyscl=9070873&mtchtyp=e&ntwrk=g&device=c&dvcmdl=&creative=673155756669&plcmnt=&plcmntcat=&aceid=&position=&gad_source=1&gclid=EAIaIQobChMIgs-9-sDFhAMVJalmAh2zPggCEAAYASAAEgJR3_D_BwE",
  page
);
