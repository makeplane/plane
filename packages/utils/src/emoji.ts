/**
 * Converts a hyphen-separated hexadecimal emoji code to its decimal representation
 * @param {string} emojiUnified - The unified emoji code in hexadecimal format (e.g., "1f600" or "1f1e6-1f1e8")
 * @returns {string} The decimal representation of the emoji code (e.g., "128512" or "127462-127464")
 * @example
 * convertHexEmojiToDecimal("1f600") // returns "128512"
 * convertHexEmojiToDecimal("1f1e6-1f1e8") // returns "127462-127464"
 * convertHexEmojiToDecimal("") // returns ""
 */
export const convertHexEmojiToDecimal = (emojiUnified: string): string => {
  if (!emojiUnified) return "";

  return emojiUnified
    .toString()
    .split("-")
    .map((e) => parseInt(e, 16))
    .join("-");
};

/**
 * Converts a hyphen-separated decimal emoji code back to its hexadecimal representation
 * @param {string} emoji - The emoji code in decimal format (e.g., "128512" or "127462-127464")
 * @returns {string} The hexadecimal representation of the emoji code (e.g., "1f600" or "1f1e6-1f1e8")
 * @example
 * emojiCodeToUnicode("128512") // returns "1f600"
 * emojiCodeToUnicode("127462-127464") // returns "1f1e6-1f1e8"
 * emojiCodeToUnicode("") // returns ""
 */
export const emojiCodeToUnicode = (emoji: string): string => {
  if (!emoji) return "";

  // convert emoji code to unicode
  const uniCodeEmoji = emoji
    .toString()
    .split("-")
    .map((emoji) => parseInt(emoji, 10).toString(16))
    .join("-");

  return uniCodeEmoji;
};

/**
 * Groups reactions by a specified key
 * @param {T[]} reactions - Array of reaction objects
 * @param {string} key - Key to group reactions by
 * @returns {Object} Object with reactions grouped by the specified key
 * @example
 * const reactions = [{ reaction: "👍", id: 1 }, { reaction: "👍", id: 2 }, { reaction: "❤️", id: 3 }];
 * groupReactions(reactions, "reaction") // returns { "👍": [{ reaction: "👍", id: 1 }, { reaction: "👍", id: 2 }], "❤️": [{ reaction: "❤️", id: 3 }] }
 */
export const groupReactions = <T extends { reaction: string }>(reactions: T[], key: string): { [key: string]: T[] } => {
  const groupedReactions = reactions.reduce(
    (acc: { [key: string]: T[] }, reaction: T) => {
      if (!acc[reaction[key as keyof T] as string]) {
        acc[reaction[key as keyof T] as string] = [];
      }
      acc[reaction[key as keyof T] as string].push(reaction);
      return acc;
    },
    {} as { [key: string]: T[] }
  );

  return groupedReactions;
};
