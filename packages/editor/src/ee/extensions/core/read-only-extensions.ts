import { Extensions } from "@tiptap/core";
// types
import { TExtensions } from "@/types";
// extensions
import { CustomCalloutReadOnlyExtension } from "src/ee/extensions/callout";

type Props = {
  disabledExtensions: TExtensions[];
};

export const CoreReadOnlyEditorAdditionalExtensions = (props: Props): Extensions => {
  const { disabledExtensions } = props;
  const extensions: Extensions = [];
  if (!disabledExtensions.includes("callout")) extensions.push(CustomCalloutReadOnlyExtension);
  return extensions;
};
