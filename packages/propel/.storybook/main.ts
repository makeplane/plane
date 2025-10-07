import type { StorybookConfig } from "@storybook/react-vite";

import { join, dirname } from "path";
import { mergeConfig } from "vite";


/*
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [getAbsolutePath("@storybook/addon-designs"), getAbsolutePath("@storybook/addon-docs")],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      define: {
        "process.env": {},
        "process.browser": true,
        "process.version": JSON.stringify(""),
      },
    });
  },
};

export default config;
