import { Extensions } from "@tiptap/core";
// types
import { TExtensions } from "@/types";
// extensions
import { CustomCalloutExtension } from "src/ee/extensions/callout";

type Props = {
  disabledExtensions: TExtensions[];
};

export const CoreEditorAdditionalExtensions = (props: Props): Extensions => {
  const { disabledExtensions } = props;
  const extensions: Extensions = [];
  if (!disabledExtensions.includes("callout")) extensions.push(CustomCalloutExtension);
  return extensions;
};
