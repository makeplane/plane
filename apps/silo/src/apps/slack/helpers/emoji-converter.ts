export function convertUnicodeToSlackEmoji(unicodeValue: string): string {
  const hexValue = Number(unicodeValue).toString(16).padStart(4, "0");
  return String.fromCodePoint(parseInt(hexValue, 16));
}
