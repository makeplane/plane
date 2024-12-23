export enum EAttributeNames {
  ICON_COLOR = "data-icon-color",
  ICON_NAME = "data-icon-name",
  EMOJI_UNICODE = "data-emoji-unicode",
  EMOJI_URL = "data-emoji-url",
  LOGO_IN_USE = "data-logo-in-use",
  BACKGROUND = "data-background",
  BLOCK_TYPE = "data-block-type",
}

export type TCalloutBlockIconAttributes = {
  [EAttributeNames.ICON_COLOR]: string | undefined;
  [EAttributeNames.ICON_NAME]: string | undefined;
};

export type TCalloutBlockEmojiAttributes = {
  [EAttributeNames.EMOJI_UNICODE]: string | undefined;
  [EAttributeNames.EMOJI_URL]: string | undefined;
};

export type TCalloutBlockAttributes = {
  [EAttributeNames.LOGO_IN_USE]: "emoji" | "icon";
  [EAttributeNames.BACKGROUND]: string;
  [EAttributeNames.BLOCK_TYPE]: "callout-component";
} & TCalloutBlockIconAttributes &
  TCalloutBlockEmojiAttributes;
