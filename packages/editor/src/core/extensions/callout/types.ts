import type { Node as ProseMirrorNode } from "@tiptap/core";

export enum ECalloutAttributeNames {
  ID = "id",
  ICON_COLOR = "data-icon-color",
  ICON_NAME = "data-icon-name",
  EMOJI_UNICODE = "data-emoji-unicode",
  EMOJI_URL = "data-emoji-url",
  LOGO_IN_USE = "data-logo-in-use",
  BACKGROUND = "data-background",
  BLOCK_TYPE = "data-block-type",
}

export type TCalloutBlockIconAttributes = {
  [ECalloutAttributeNames.ICON_COLOR]: string | undefined;
  [ECalloutAttributeNames.ICON_NAME]: string | undefined;
};

export type TCalloutBlockEmojiAttributes = {
  [ECalloutAttributeNames.EMOJI_UNICODE]: string | undefined;
  [ECalloutAttributeNames.EMOJI_URL]: string | undefined;
};

export type TCalloutBlockAttributes = {
  [ECalloutAttributeNames.ID]: string | null;
  [ECalloutAttributeNames.LOGO_IN_USE]: "emoji" | "icon";
  [ECalloutAttributeNames.BACKGROUND]: string | undefined;
  [ECalloutAttributeNames.BLOCK_TYPE]: "callout-component";
} & TCalloutBlockIconAttributes &
  TCalloutBlockEmojiAttributes;

export type CustomCalloutExtensionOptions = unknown;
export type CustomCalloutExtensionStorage = unknown;

export type CustomCalloutExtensionType = ProseMirrorNode<CustomCalloutExtensionOptions, CustomCalloutExtensionStorage>;
