export const THEMES = ["light", "dark", "light-contrast", "dark-contrast", "custom"];

export const THEME_OPTIONS = [
  {
    key: "system_preference",
    value: "system",
    i18n_label: "system_preference" as const,
    type: "light",
    icon: {
      border: "#DEE2E6",
      color1: "#FAFAFA",
      color2: "#3F76FF",
    },
  },
  {
    key: "light",
    value: "light",
    i18n_label: "light" as const,
    type: "light",
    icon: {
      border: "#DEE2E6",
      color1: "#FAFAFA",
      color2: "#3F76FF",
    },
  },
  {
    key: "dark",
    value: "dark",
    i18n_label: "dark" as const,
    type: "dark",
    icon: {
      border: "#2E3234",
      color1: "#191B1B",
      color2: "#3C85D9",
    },
  },
  {
    key: "light_contrast",
    value: "light-contrast",
    i18n_label: "light_contrast" as const,
    type: "light",
    icon: {
      border: "#000000",
      color1: "#FFFFFF",
      color2: "#3F76FF",
    },
  },
  {
    key: "dark_contrast",
    value: "dark-contrast",
    i18n_label: "dark_contrast" as const,
    type: "dark",
    icon: {
      border: "#FFFFFF",
      color1: "#030303",
      color2: "#3A8BE9",
    },
  },
  {
    key: "custom",
    value: "custom",
    i18n_label: "custom" as const,
    type: "light",
    icon: {
      border: "#FFC9C9",
      color1: "#FFF7F7",
      color2: "#FF5151",
    },
  },
] as const;

export type I_THEME_OPTION = (typeof THEME_OPTIONS)[number];
