import TextAlign from "@tiptap/extension-text-align";

export const CustomTextAlignExtension = TextAlign.configure({
  alignments: ["left", "center", "right"],
  types: ["heading", "paragraph"],
});
