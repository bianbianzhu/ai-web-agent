/**
 * This function is used to sleep the execution of the program for a given amount of time
 * @param delay - The amount of time to sleep in milliseconds
 */
export const sleep = async (delay: number): Promise<void> => {
  return await new Promise((resolve) => setTimeout(resolve, delay));
};

/**
 * Check if the file path is a valid image path that ends with .jpg, .jpeg, or .png (case-insensitive)
 * @param filePath - The file path to check
 * @returns A boolean indicating whether the file path is valid
 */
export const isValidImagePath = (filePath: string): boolean => {
  // Regular expression to match file paths ending with .jpg, .jpeg, or .png
  const regex = /\.(jpg|jpeg|png)$/i;

  // Test the filePath against the regex
  return regex.test(filePath);
};
