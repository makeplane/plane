export const emojiCodeToUnicode = (emoji: string) => {
  if (!emoji) return "";

  // convert emoji code to unicode
  const uniCodeEmoji = emoji
    .toString()
    .split("-")
    .map((emoji) => parseInt(emoji, 10).toString(16))
    .join("-");

  return uniCodeEmoji;
};
