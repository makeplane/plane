import type { StorybookConfig } from "@storybook/nextjs-vite";
import { join, dirname } from "path"
import { mergeConfig } from "vite";

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')))
}
const config: StorybookConfig = {
  "stories": [
    "../core/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../app/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../ee/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../ce/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-vitest")
  ],
  "framework": {
    "name": getAbsolutePath("@storybook/nextjs-vite"),
    "options": {}
  },
  "staticDirs": [
    "../public"
  ],
  viteFinal: async (config) => {
    const path = require('path');
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@plane/utils': path.resolve(__dirname, '../../../packages/utils/src/index.ts'),
          '@plane/types': path.resolve(__dirname, '../../../packages/types/src/index.ts'),
          '@plane/ui': path.resolve(__dirname, '../../../packages/ui/src/index.ts'),
          '@plane/constants': path.resolve(__dirname, '../../../packages/constants/src/index.ts')
        }
      },
      optimizeDeps: {
        include: ['@plane/utils', '@plane/types', '@plane/ui', '@plane/constants']
      }
    });
  }
};
export default config;