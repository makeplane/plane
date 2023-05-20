export const THEMES = ["light", "dark", "light-contrast", "dark-contrast", "custom"];

export const THEMES_OBJ = [
  {
    value: "light",
    label: "Light",
    type: "light",
    icon: {
      border: "#DEE2E6",
      color1: "#FAFAFA",
      color2: "#3F76FF",
    },
  },
  {
    value: "dark",
    label: "Dark",
    type: "dark",
    icon: {
      border: "#2E3234",
      color1: "#191B1B",
      color2: "#3C85D9",
    },
  },
  {
    value: "light-contrast",
    label: "Light High Contrast",
    type: "light",
    icon: {
      border: "#000000",
      color1: "#FFFFFF",
      color2: "#3F76FF",
    },
  },
  {
    value: "dark-contrast",
    label: "Dark High Contrast",
    type: "dark",
    icon: {
      border: "#FFFFFF",
      color1: "#030303",
      color2: "#3A8BE9",
    },
  },
  {
    value: "custom",
    label: "Custom",
    type: "light",
    icon: {
      border: "#FFC9C9",
      color1: "#FFF7F7",
      color2: "#FF5151",
    },
  },
];
