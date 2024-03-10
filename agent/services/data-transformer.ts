import fs from "fs";
import { isValidImagePath, isValidJson } from "../utils.js";

// Define all 4 types of response messages
export enum ResponseMessageCategory {
  URL = "url",
  CLICK = "click",
  REGULAR = "regular",
  INITIAL = "initial",
}

type ResponseActionMessageCategory = Extract<
  ResponseMessageCategory,
  ResponseMessageCategory.CLICK | ResponseMessageCategory.URL
>;

export type ResponseMessage =
  | {
      type: ResponseMessageCategory.URL;
      url: string;
    }
  | {
      type: ResponseMessageCategory.CLICK;
      linkText: string;
    }
  | {
      type: ResponseMessageCategory.INITIAL;
      text: "initial";
    }
  | {
      type: ResponseMessageCategory.REGULAR;
      text: string;
    };

//TODO: add one more response type: GO BACK - because LLM does not store all the history of the navigation. It cannot go back to the previous page directly.

const URI_PREFIX = "data:image/jpeg;base64,";
const RESPONSE_MESSAGE_ACTION_START_INDICATOR: Record<
  ResponseActionMessageCategory,
  string
> = {
  [ResponseMessageCategory.URL]: '{"url": "',
  [ResponseMessageCategory.CLICK]: '{"click": "',
};
const RESPONSE_MESSAGE_ACTION_END_INDICATOR = '"}';

/**
 * This service takes the path to an image file and returns a base64 string. Transform the image into a format that can be processed by the GPT model
 * @param imageFilePath - The path to the image file
 * @returns A promise that resolves to the base64 string
 */
export const imageToBase64String = async (imageFilePath: string) => {
  // check if the file path is a string of jpg or jpeg or png
  if (!isValidImagePath(imageFilePath)) {
    throw new Error("Invalid image file path");
  }
  try {
    // Read the image from disk in an async manner
    // The fs.promises.readFile method returns a promise and avoids the need for a callback (as in the fs.readFile method)
    const data = await fs.promises.readFile(imageFilePath);
    // Convert the image data to a base64 string
    const base64String = data.toString("base64");
    // prepend the metadata to the base64 string
    const dataURI = `${URI_PREFIX}${base64String}`;
    return dataURI;
  } catch (err) {
    throw new Error(`Error reading file from disk: ${err}`);
  }
};

export const imageToBase64StringV2 = async (
  imageFilePath: string
): Promise<string | undefined> => {
  if (!isValidImagePath(imageFilePath)) {
    throw new Error("Invalid image file path");
  }

  // declare a variable to store the base64 string
  let base64String: string | undefined;

  // Read the image from disk in an async manner
  await (() =>
    new Promise<void>((resolve, reject) => {
      fs.readFile(imageFilePath, (err, data) => {
        if (err) {
          reject(`Error reading file from disk: ${err}`);
          return; // without this, the function will continue to execute (like .toString method); although the promise will remain rejected.
        }

        base64String = data.toString("base64");
        resolve();
        return;
      });
    }))();

  return `${URI_PREFIX}${base64String}`;
};

// TODO: optimize this function
export const extractActionFromString = (
  string: string,
  type: ResponseActionMessageCategory
) => {
  let action: string | null = null;

  if (isValidJson(string)) {
    const parsedObject = JSON.parse(string);
    action = type in parsedObject ? parsedObject[type] : null;
  }

  // to resolve potential response message text like 'The url is {"url": "url goes here"}'
  if (
    action === null &&
    string.includes(RESPONSE_MESSAGE_ACTION_START_INDICATOR[type])
  ) {
    action = string
      .split(RESPONSE_MESSAGE_ACTION_START_INDICATOR[type])[1]
      .split(RESPONSE_MESSAGE_ACTION_END_INDICATOR)[0];
  }

  return action;
};

export const convertTextToResponseMessage = (text: string): ResponseMessage => {
  if (extractActionFromString(text, ResponseMessageCategory.URL) !== null) {
    return {
      type: ResponseMessageCategory.URL,
      url: extractActionFromString(text, ResponseMessageCategory.URL) as string,
    };
  }

  if (extractActionFromString(text, ResponseMessageCategory.CLICK) !== null) {
    return {
      type: ResponseMessageCategory.CLICK,
      linkText: extractActionFromString(
        text,
        ResponseMessageCategory.CLICK
      ) as string,
    };
  }

  if (text === ResponseMessageCategory.INITIAL) {
    return {
      type: ResponseMessageCategory.INITIAL,
      text,
    };
  }

  return {
    type: ResponseMessageCategory.REGULAR,
    text,
  };
};

export const shouldContinueLoop = (ResponseMessage: ResponseMessage) => {
  const { type } = ResponseMessage;

  if (type === ResponseMessageCategory.REGULAR) {
    return false;
  }

  return true;
};
