// plane imports
import type { TLogoProps } from "@plane/types";
import { sanitizeHTML } from "@plane/utils";
// types
import type { TCalloutBlockAttributes, TCalloutBlockEmojiAttributes, TCalloutBlockIconAttributes } from "./types";
import { ECalloutAttributeNames } from "./types";

export const DEFAULT_CALLOUT_BLOCK_ATTRIBUTES: TCalloutBlockAttributes = {
  [ECalloutAttributeNames.ID]: null,
  [ECalloutAttributeNames.LOGO_IN_USE]: "emoji",
  [ECalloutAttributeNames.ICON_COLOR]: undefined,
  [ECalloutAttributeNames.ICON_NAME]: undefined,
  [ECalloutAttributeNames.EMOJI_UNICODE]: "128161",
  [ECalloutAttributeNames.EMOJI_URL]: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4a1.png",
  [ECalloutAttributeNames.BACKGROUND]: undefined,
  [ECalloutAttributeNames.BLOCK_TYPE]: "callout-component",
};

type TStoredLogoValue = Pick<TCalloutBlockAttributes, ECalloutAttributeNames.LOGO_IN_USE> &
  (TCalloutBlockEmojiAttributes | TCalloutBlockIconAttributes);

// function to get the stored logo from local storage
export const getStoredLogo = (): TStoredLogoValue => {
  const fallBackValues: TStoredLogoValue = {
    [ECalloutAttributeNames.LOGO_IN_USE]: "emoji",
    [ECalloutAttributeNames.EMOJI_UNICODE]: DEFAULT_CALLOUT_BLOCK_ATTRIBUTES[ECalloutAttributeNames.EMOJI_UNICODE],
    [ECalloutAttributeNames.EMOJI_URL]: DEFAULT_CALLOUT_BLOCK_ATTRIBUTES[ECalloutAttributeNames.EMOJI_URL],
  };

  if (typeof window !== "undefined") {
    const storedData = sanitizeHTML(localStorage.getItem("editor-calloutComponent-logo") ?? "");
    if (storedData) {
      let parsedData: TLogoProps;
      try {
        parsedData = JSON.parse(storedData) as TLogoProps;
      } catch (error) {
        console.error(`Error parsing stored callout logo, stored value- ${storedData}`, error);
        localStorage.removeItem("editor-calloutComponent-logo");
        return fallBackValues;
      }
      if (parsedData.in_use === "emoji" && parsedData.emoji?.value) {
        return {
          [ECalloutAttributeNames.LOGO_IN_USE]: "emoji",
          [ECalloutAttributeNames.EMOJI_UNICODE]:
            parsedData.emoji.value || DEFAULT_CALLOUT_BLOCK_ATTRIBUTES[ECalloutAttributeNames.EMOJI_UNICODE],
          [ECalloutAttributeNames.EMOJI_URL]:
            parsedData.emoji.url || DEFAULT_CALLOUT_BLOCK_ATTRIBUTES[ECalloutAttributeNames.EMOJI_URL],
        };
      }
      if (parsedData.in_use === "icon" && parsedData.icon?.name) {
        return {
          [ECalloutAttributeNames.LOGO_IN_USE]: "icon",
          [ECalloutAttributeNames.ICON_NAME]:
            parsedData.icon.name || DEFAULT_CALLOUT_BLOCK_ATTRIBUTES[ECalloutAttributeNames.ICON_NAME],
          [ECalloutAttributeNames.ICON_COLOR]:
            parsedData.icon.color || DEFAULT_CALLOUT_BLOCK_ATTRIBUTES[ECalloutAttributeNames.ICON_COLOR],
        };
      }
    }
  }
  // fallback values
  return fallBackValues;
};
// function to update the stored logo on local storage
export const updateStoredLogo = (value: TLogoProps): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("editor-calloutComponent-logo", JSON.stringify(value));
};
// function to get the stored background color from local storage
export const getStoredBackgroundColor = (): string | null => {
  if (typeof window !== "undefined") {
    return sanitizeHTML(localStorage.getItem("editor-calloutComponent-background") ?? "");
  }
  return null;
};
// function to update the stored background color on local storage
export const updateStoredBackgroundColor = (value: string | null): void => {
  if (typeof window === "undefined") return;
  if (value === null) {
    localStorage.removeItem("editor-calloutComponent-background");
    return;
  } else {
    localStorage.setItem("editor-calloutComponent-background", value);
  }
};
