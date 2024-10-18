import TextAlign from "@tiptap/extension-text-align";

export type TTextAlign = "left" | "center" | "right";

export const CustomTextAlignExtension = TextAlign.configure({
  alignments: ["left", "center", "right"],
  types: ["heading", "paragraph"],
});
