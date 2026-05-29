import { escapeForRegEx } from "@tiptap/core";
import type { Trigger, SuggestionMatch } from "@tiptap/suggestion";

export function customFindSuggestionMatch(config: Trigger): SuggestionMatch | null {
  const { char, allowSpaces: allowSpacesOption, allowToIncludeChar, allowedPrefixes, startOfLine, $position } = config;

  const allowSpaces = allowSpacesOption && !allowToIncludeChar;

  const escapedChar = escapeForRegEx(char);
  const suffix = new RegExp(`\\s${escapedChar}$`);
  const prefix = startOfLine ? "^" : "";
  const finalEscapedChar = allowToIncludeChar ? "" : escapedChar;
  const regexp = allowSpaces
    ? new RegExp(`${prefix}${escapedChar}.*?(?=\\s${finalEscapedChar}|$)`, "gm")
    : new RegExp(`${prefix}(?:^)?${escapedChar}[^\\s${finalEscapedChar}]*`, "gm");

  // Instead of just looking at nodeBefore.text, we need to extract text from the current paragraph
  // to properly handle text with decorators like bold, italic, etc.
  const currentParagraph = $position.parent;
  if (!currentParagraph.isTextblock) {
    return null;
  }

  // Get the start position of the current paragraph
  const paragraphStart = $position.start();
  // Extract text content using textBetween which handles text across different nodes/marks
  const text = $position.doc.textBetween(paragraphStart, $position.pos, "\0", "\0");

  if (!text) {
    return null;
  }

  const textFrom = paragraphStart;
  const match = Array.from(text.matchAll(regexp)).pop();

  if (!match || match.input === undefined || match.index === undefined) {
    return null;
  }

  // JavaScript doesn't have lookbehinds. This hacks a check that first character
  // is a space or the start of the line
  const matchPrefix = match.input.slice(Math.max(0, match.index - 1), match.index);
  const matchPrefixIsAllowed = new RegExp(`^[${allowedPrefixes?.join("")}]?$`).test(matchPrefix);

  if (allowedPrefixes && allowedPrefixes.length > 0 && !matchPrefixIsAllowed) {
    return null;
  }

  // The absolute position of the match in the document
  const from = textFrom + match.index;
  let to = from + match[0].length;

  // Edge case handling; if spaces are allowed and we're directly in between
  // two triggers
  if (allowSpaces && suffix.test(text.slice(to - 1, to + 1))) {
    match[0] += " ";
    to += 1;
  }

  // If the $position is located within the matched substring, return that range
  if (from < $position.pos && to >= $position.pos) {
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
