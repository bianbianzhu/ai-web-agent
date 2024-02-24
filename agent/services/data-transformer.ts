import fs from "fs";
import { isValidImagePath } from "../utils.js";

const URI_PREFIX = "data:image/jpeg;base64,";

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
