import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";

/**
 * An instance of the OpenAI Class that can invoke the API methods
 * @example `openai.chat.completions.create`
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
