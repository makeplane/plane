export const parseDataStream = (dataStream: string) =>
  // Split the input by newline and filter out lines that start with 'data: '
  dataStream
    .split("\n") // Split input into lines
    .filter((line) => line.startsWith("data: ")) // Keep only lines that start with 'data: '
    .map((line) => line.replace("data: ", "")) // Remove the 'data: ' prefix
    .join("") // Join all characters into a single string
    .replace("[DONE]", "");
