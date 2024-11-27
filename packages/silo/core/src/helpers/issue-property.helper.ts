import { TTextSettings, TTextSettingsDisplayOptions } from "@plane/sdk";

export const getTextPropertySettings = (display_format: TTextSettingsDisplayOptions): TTextSettings => {
  switch (display_format) {
    case "single-line":
      return { display_format: "single-line" };
    case "multi-line":
      return { display_format: "multi-line" };
    case "readonly":
      return { display_format: "readonly" };
  }
};
