import { escapeForRegEx, Range } from "@tiptap/core";
import { ResolvedPos } from "@tiptap/pm/model";

export interface Trigger {
  char: string;
  allowSpaces: boolean;
  allowToIncludeChar: boolean;
  allowedPrefixes: string[] | null;
  startOfLine: boolean;
  $position: ResolvedPos;
}

export type SuggestionMatch = {
  range: Range;
  query: string;
  text: string;
} | null;

export function customFindSuggestionMatch(config: Trigger): SuggestionMatch {
  const { char, allowSpaces: allowSpacesOption, allowToIncludeChar, allowedPrefixes, startOfLine, $position } = config;
  console.log("customFindSuggestionMatch");

  const allowSpaces = allowSpacesOption && !allowToIncludeChar;

  const escapedChar = escapeForRegEx(char);
  const suffix = new RegExp(`\\s${escapedChar}$`);
  const prefix = startOfLine ? "^" : "";
  const finalEscapedChar = allowToIncludeChar ? "" : escapedChar;
  const regexp = allowSpaces
    ? new RegExp(`${prefix}${escapedChar}.*?(?=\\s${finalEscapedChar}|$)`, "gm")
    : new RegExp(`${prefix}(?:^)?${escapedChar}[^\\s${finalEscapedChar}]*`, "gm");

  // Get the text block that contains the current position
  const textBlock = $position.parent;

  if (!textBlock.isTextblock) {
    return null;
  }

  // Get the text content of the entire block
  const blockText = textBlock.textContent;
  const blockStart = $position.start();
  const relativePos = $position.pos - blockStart;

  if (relativePos < 0) {
    return null;
  }

  // Look for the trigger character in the text before the current position
  const textBeforeCursor = blockText.slice(0, relativePos);

  // Find the last occurrence of the trigger character
  const lastTriggerIndex = textBeforeCursor.lastIndexOf(char);

  if (lastTriggerIndex === -1) {
    return null;
  }

  // Check if the trigger character has an allowed prefix
  const prefixChar = lastTriggerIndex > 0 ? textBeforeCursor[lastTriggerIndex - 1] : "\0";
  const matchPrefixIsAllowed = new RegExp(`^[${allowedPrefixes?.join("")}\0]?$`).test(prefixChar);

  if (allowedPrefixes !== null && !matchPrefixIsAllowed) {
    return null;
  }

  // Extract the potential match text from the trigger character to the cursor position
  const matchText = textBeforeCursor.slice(lastTriggerIndex);

  // Test if this matches our regex pattern
  const match = matchText.match(regexp);

  if (!match) {
    return null;
  }

  // Calculate the absolute positions
  const from = blockStart + lastTriggerIndex;
  let to = from + match[0].length;

  // Edge case handling; if spaces are allowed and we're directly in between
  // two triggers
  if (allowSpaces && suffix.test(blockText.slice(to - 1, to + 1))) {
    match[0] += " ";
    to += 1;
  }

  // If the $position is located within the matched substring, return that range
  if (from < $position.pos && to >= $position.pos) {
    // Additional check: make sure we're not inside a code block or other restricted context
    const $from = $position.doc.resolve(from);
    if ($from.parent.type.spec.code) {
      return null;
    }

    return {
      range: {
        from,
        to,
      },
      query: match[0].slice(char.length),
      text: match[0],
    };
  }

  return null;
}
