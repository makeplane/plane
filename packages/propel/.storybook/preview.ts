import type { Preview } from "@storybook/react-vite";
import "@plane/tailwind-config/global.css";
import "../src/styles/react-day-picker.css";

const parameters: Preview["parameters"] = {
  controls: {
    matchers: {},
  },
};

const preview: Preview = {
  parameters,
  tags: ["autodocs"],
};
export default preview;
