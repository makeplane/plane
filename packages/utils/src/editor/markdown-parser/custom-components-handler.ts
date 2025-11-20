import type { Handle } from "hast-util-to-mdast";
// local imports
import { createTextNode } from "./common";
import type { TCustomComponentsMetaData } from "./types";

type TArgs = {
  metaData: TCustomComponentsMetaData;
};

export const parseCustomComponents = (args: TArgs): Record<string, Handle> => {
  const { metaData } = args;

  const getFileAssetDetails = (id: string) => metaData.file_assets.find((asset) => asset.id === id);

  return {
    "image-component": (_state, node) => {
      const properties = node.properties || {};
      const src = String(properties.src);
      const fileAssetDetails = getFileAssetDetails(src);
      if (!src || !fileAssetDetails) return createTextNode("");
      return createTextNode(`![${fileAssetDetails.name}](${fileAssetDetails.url})`);
    },
    img: (_state, node) => {
      const properties = node.properties || {};
      const src = String(properties.src);
      const alt = String(properties.alt);
      if (!src || !alt) return createTextNode("");
      return createTextNode(`![${alt || "Image"}](${src})`);
    },
    "mention-component": (_state, node) => {
      const properties = node.properties || {};
      const userId = String(properties.entity_identifier);
      const userDetails = metaData.user_mentions.find((user) => user.id === userId);
      if (!userDetails) return createTextNode("");
      return createTextNode(`[@${userDetails.display_name || "Unknown user"}](${userDetails.url || ""}) `);
    },
    ...parseExtendedCustomComponents({ metaData }),
  };
};

export const parseExtendedCustomComponents = (_args: TArgs): Record<string, Handle> => ({});
