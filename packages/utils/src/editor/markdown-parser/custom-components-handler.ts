import type { Handle } from "hast-util-to-mdast";
// local imports
import { createTextNode } from "./common";
import type { TCustomComponentsMetaData } from "./index";

type TArgs = {
  metaData: TCustomComponentsMetaData;
  workspaceSlug: string;
};

export const parseCustomComponents = (args: TArgs): Record<string, Handle> => {
  const { metaData, workspaceSlug } = args;

  const getFileAssetName = (id: string): string => {
    const fileAsset = metaData.file_assets.find((asset) => asset.id === id);
    return fileAsset?.name || "";
  };

  const baseURL = process.env.WEB_BASE_URL || process.env.APP_BASE_URL || "";
  const resolvedBaseURL = baseURL[baseURL.length - 1] === "/" ? baseURL : `${baseURL}/`;

  return {
    "image-component": (_state, node) => {
      const properties = node.properties || {};
      const src = String(properties.src);
      const path = getFileAssetName(src);

      return createTextNode(`![${path}](./${path})`);
    },
    img: (_state, node) => {
      const properties = node.properties || {};
      const src = String(properties.src);
      const alt = String(properties.alt);

      return createTextNode(`![${alt || "Image"}](${src})`);
    },
    "mention-component": (_state, node) => {
      const properties = node.properties || {};
      const userId = String(properties.entity_identifier);
      const userDetails = metaData.user_mentions.find((user) => user.id === userId);
      const path = `${workspaceSlug}/profile/${userId}`;
      const url = `${resolvedBaseURL}${path}`;

      return createTextNode(`[@${userDetails?.display_name || ""}](${url}) `);
    },
    "attachment-component": (_state, node) => {
      const properties = node.properties || {};
      const src = String(properties.src || "");
      const path = getFileAssetName(src);

      return createTextNode(`[${path}](./${path})`);
    },
    "inline-math-component": (_state, node) => createTextNode(`$${node.properties?.latex || ""}$ `),
    "block-math-component": (_state, node) => createTextNode(`$$\n${node.properties?.latex || ""}\n$$`),
    "external-embed-component": (_state, node) => {
      const properties = node.properties || {};
      const src = String(properties.src || "");

      return createTextNode(`[Embed](${src})`);
    },
    "page-embed-component": (_state, node) => {
      const properties = node.properties || {};
      const subPageId = String(properties?.["entity_identifier"]);
      const subPageName = metaData.page_embeds.find((page) => page.id === subPageId)?.name || "";
      const path = `./${subPageId}/${subPageId}.md`;

      return createTextNode(`[${subPageName}](${path})`);
    },
    // "page-link-component": (h: any, node: HASTElement) => {
    //   return h(node, "text", `[${node.properties?.name || "page"}](${node.properties?.src || ""})`);
    // },
    "issue-embed-component": (_state, node) => {
      const properties = node.properties || {};
      const workItemId = String(properties?.["entity_identifier"]);
      const workItemDetails = metaData.work_item_embeds.find((workItem) => workItem.id === workItemId);
      const workItemIdentifier = `${workItemDetails?.project__identifier || ""}-${workItemDetails?.sequence_id || ""}`;
      const path = `${workspaceSlug}/browse/${workItemIdentifier}`;
      const url = `${resolvedBaseURL}${path}`;

      return createTextNode(`[${workItemIdentifier}](${url})`);
    },
  };
};
