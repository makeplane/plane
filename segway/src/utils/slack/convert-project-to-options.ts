import { PlainTextOption } from "./create-issue-modal";

export const convertProjectToOptions = (
  projects: Array<{
    id: string;
    name: string | null;
  }>,
): Array<PlainTextOption> =>
  projects.map((project) => ({
    text: {
      type: "plain_text",
      text: project.name === null ? "" : project.name,
      emoji: true,
    },
    value: project.id,
  }));
