import type { Text as MDASTText } from "mdast";

export const createTextNode = (value: string): MDASTText => ({
  type: "text",
  value,
});
