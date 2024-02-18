import readline from "readline";

export const userPromptInterface = async (query: string) => {
  let prompt: string | undefined;

  const userInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await (async () =>
    new Promise<void>((resolve) => {
      userInterface.question(query, (input) => {
        prompt = input;
        userInterface.close();
        resolve();
      });
    }))();

  return prompt;
};

export const userPromptInterfaceV2 = async (query: string) => {
  // Create an interface to read input from the user
  const userInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Return a promise that resolves to the user's input
  // The userInterface.question method takes a query and a callback function
  // The reason for using a promise is to make the user's input accessible outside of the callback function
  return new Promise<string>((resolve) => {
    userInterface.question(query, (input) => {
      resolve(input);
      userInterface.close();
    });
  });
};
