import type { Preview } from "@storybook/react-vite";
import "@plane/tailwind-config/global.css";

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
