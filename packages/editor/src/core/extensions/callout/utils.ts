// plane helpers
import { sanitizeHTML } from "@plane/utils";
// plane ui
import { TEmojiLogoProps } from "@plane/ui";
// types
import {
  EAttributeNames,
  TCalloutBlockAttributes,
  TCalloutBlockEmojiAttributes,
  TCalloutBlockIconAttributes,
} from "./types";

export const DEFAULT_CALLOUT_BLOCK_ATTRIBUTES: TCalloutBlockAttributes = {
  "data-logo-in-use": "emoji",
  "data-icon-color": null,
  "data-icon-name": null,
  "data-emoji-unicode": "128161",
  "data-emoji-url": "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4a1.png",
  "data-background": null,
  "data-block-type": "callout-component",
};

type TStoredLogoValue = Pick<TCalloutBlockAttributes, EAttributeNames.LOGO_IN_USE> &
  (TCalloutBlockEmojiAttributes | TCalloutBlockIconAttributes);

// function to get the stored logo from local storage
export const getStoredLogo = (): TStoredLogoValue => {
  const fallBackValues: TStoredLogoValue = {
    "data-logo-in-use": "emoji",
    "data-emoji-unicode": DEFAULT_CALLOUT_BLOCK_ATTRIBUTES["data-emoji-unicode"],
    "data-emoji-url": DEFAULT_CALLOUT_BLOCK_ATTRIBUTES["data-emoji-url"],
  };

  if (typeof window !== "undefined") {
    const storedData = sanitizeHTML(localStorage.getItem("editor-calloutComponent-logo"));
    if (storedData) {
      let parsedData: TEmojiLogoProps;
      try {
        parsedData = JSON.parse(storedData);
      } catch (error) {
        console.error(`Error parsing stored callout logo, stored value- ${storedData}`, error);
        localStorage.removeItem("editor-calloutComponent-logo");
        return fallBackValues;
      }
      if (parsedData.in_use === "emoji" && parsedData.emoji?.value) {
        return {
          "data-logo-in-use": "emoji",
          "data-emoji-unicode": parsedData.emoji.value || DEFAULT_CALLOUT_BLOCK_ATTRIBUTES["data-emoji-unicode"],
          "data-emoji-url": parsedData.emoji.url || DEFAULT_CALLOUT_BLOCK_ATTRIBUTES["data-emoji-url"],
        };
      }
      if (parsedData.in_use === "icon" && parsedData.icon?.name) {
        return {
          "data-logo-in-use": "icon",
          "data-icon-name": parsedData.icon.name || DEFAULT_CALLOUT_BLOCK_ATTRIBUTES["data-icon-name"],
          "data-icon-color": parsedData.icon.color || DEFAULT_CALLOUT_BLOCK_ATTRIBUTES["data-icon-color"],
        };
      }
    }
  }
  // fallback values
  return fallBackValues;
};
// function to update the stored logo on local storage
export const updateStoredLogo = (value: TEmojiLogoProps): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("editor-calloutComponent-logo", JSON.stringify(value));
};
// function to get the stored background color from local storage
export const getStoredBackgroundColor = (): string | null => {
  if (typeof window !== "undefined") {
    return sanitizeHTML(localStorage.getItem("editor-calloutComponent-background"));
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
