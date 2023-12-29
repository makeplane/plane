import { PlainTextOption } from "./create-issue-modal";

export const convertToSlackOption = (point: {
  id: string;
  name: string | null;
}): PlainTextOption => ({
  text: {
    type: "plain_text",
    text: point.name === null ? "" : point.name,
    emoji: true,
  },
  value: point.id,
});

export const convertToSlackOptions = (
  data: Array<{
    id: string;
    name: string | null;
  }>,
): Array<PlainTextOption> => data.map((point) => convertToSlackOption(point));
