// plane ui
import { TEmojiLogoProps } from "@plane/ui";
// types
import { TCalloutBlockAttributes } from "./types";

export const DEFAULT_CALLOUT_BLOCK_ATTRIBUTES: TCalloutBlockAttributes = {
  class: "",
  dataLogoInUse: "emoji",
  dataIconColor: null,
  dataIconName: null,
  dataEmoji: "128161",
  dataBackground: null,
};

// function to get the stored logo from local storage
export const getStoredLogo = (): Partial<TCalloutBlockAttributes> => {
  if (typeof window !== "undefined") {
    const storedData = localStorage.getItem("editor-calloutComponent-logo");
    if (storedData) {
      const parsedData: TEmojiLogoProps = JSON.parse(storedData);
      if (parsedData.in_use === "emoji" && parsedData.emoji?.value) {
        return {
          dataLogoInUse: "emoji",
          dataEmoji: parsedData.emoji.value,
        };
      }
      if (parsedData.in_use === "icon" && parsedData.icon?.name) {
        return {
          dataLogoInUse: "icon",
          dataIconName: parsedData.icon.name,
          dataIconColor: parsedData.icon.color || "",
        };
      }
    }
  }
  // fallback values
  return {
    dataLogoInUse: "emoji",
    dataEmoji: DEFAULT_CALLOUT_BLOCK_ATTRIBUTES.dataEmoji,
  };
};
// function to update the stored logo on local storage
export const updateStoredLogo = (value: TEmojiLogoProps): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("editor-calloutComponent-logo", JSON.stringify(value));
};
// function to get the stored background color from local storage
export const getStoredBackgroundColor = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("editor-calloutComponent-background");
  }
  return null;
};
// function to update the stored background color on local storage
export const updateStoredBackgroundColor = (value: string | null): void => {
  if (typeof window === "undefined") return;
  if(!value) {
    localStorage.removeItem("editor-calloutComponent-background");
    return;
  } else {

    localStorage.setItem("editor-calloutComponent-background", value);
  }
};
