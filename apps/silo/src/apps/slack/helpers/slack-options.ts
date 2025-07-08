export type PlainTextOption = {
  text: {
    type: "plain_text";
    text: string;
    emoji: true;
  };
  value: string;
};

/**
 * Truncates a name if it exceeds the max length, adding ellipsis as needed
 * @param name The name to truncate
 * @param maxLength Maximum length of name
 * @returns The truncated name
 */
export const truncateName = (name: string, maxLength: number = 75): string =>
  name.length > maxLength ? name.substring(0, maxLength - 3) + "..." : name;

/**
 * Creates a formatted option for Slack with name truncation
 */
export const convertToSlackOption = (point: { id?: string; name?: string }): PlainTextOption => {
  const displayText = truncateName(point.name || "");

  return {
    text: {
      type: "plain_text",
      text: displayText,
      emoji: true,
    },
    value: point.id || "",
  };
};

export const convertToSlackOptions = (
  data: Array<{
    id?: string;
    name?: string;
  }>
): Array<PlainTextOption> => data.map((point) => convertToSlackOption(point));
