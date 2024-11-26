export type PlainTextOption = {
  text: {
    type: "plain_text";
    text: string;
    emoji: true;
  };
  value: string;
};

export const convertToSlackOption = (point: { id?: string; name?: string }): PlainTextOption => ({
  text: {
    type: "plain_text",
    text: point.name ? point.name : "",
    emoji: true,
  },
  value: point.id || "",
});

export const convertToSlackOptions = (
  data: Array<{
    id?: string;
    name?: string;
  }>
): Array<PlainTextOption> => data.map((point) => convertToSlackOption(point));
