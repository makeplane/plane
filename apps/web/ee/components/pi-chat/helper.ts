import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";

export const parseDataStream = (dataStream: string) =>
  // Split the input by newline and filter out lines that start with 'data: '
  dataStream
    .split("\n") // Split input into lines
    .filter((line) => line.startsWith("data: ")) // Keep only lines that start with 'data: '
    .map((line) => line.replace("data: ", "")) // Remove the 'data: ' prefix
    .join("") // Join all characters into a single string
    .replace("[DONE]", "");

export const scrollIntoViewHelper = async (elementId: string) => {
  const sourceElementId = elementId ?? "";
  const sourceElement = document.getElementById(sourceElementId);
  if (sourceElement) await smoothScrollIntoView(sourceElement, { behavior: "smooth", block: "center", duration: 1500 });
};
