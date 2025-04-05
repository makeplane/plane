export const generateTitleProsemirrorJson = (text: string) => {
  return {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [
          {
            type: "text",
            text,
          },
        ],
      },
    ],
  };
};
