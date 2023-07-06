export const renderEmoji = (emoji: string) => {
  if (!emoji) return;

  return isNaN(parseInt(emoji)) ? emoji : String.fromCodePoint(parseInt(emoji));
};
