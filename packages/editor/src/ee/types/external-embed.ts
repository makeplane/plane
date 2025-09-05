// Core Enums
export enum EExternalEmbedEntityType {
  EMBED = "embed",
  RICH_CARD = "rich_card",
}

export enum EExternalEmbedAttributeNames {
  SOURCE = "src",
  ID = "id",
  EMBED_DATA = "data-embed-data",
  IS_RICH_CARD = "data-is-rich-card",
  HAS_EMBED_FAILED = "data-has-embed-failed",
  HAS_TRIED_EMBEDDING = "data-has-tried-embedding",
  ENTITY_NAME = "data-entity-name",
  ENTITY_TYPE = "data-entity-type",
}

// Core Types with strict mapping
export type TExternalEmbedBlockAttributes = Record<EExternalEmbedAttributeNames, unknown> & {
  [EExternalEmbedAttributeNames.SOURCE]: string | null;
  [EExternalEmbedAttributeNames.ID]: string | null;
  [EExternalEmbedAttributeNames.EMBED_DATA]: string | null;
  [EExternalEmbedAttributeNames.IS_RICH_CARD]: boolean;
  [EExternalEmbedAttributeNames.HAS_EMBED_FAILED]: boolean;
  [EExternalEmbedAttributeNames.HAS_TRIED_EMBEDDING]: boolean;
  [EExternalEmbedAttributeNames.ENTITY_NAME]: string | null;
  [EExternalEmbedAttributeNames.ENTITY_TYPE]: EExternalEmbedEntityType;
};

export type { ExternalEmbedNodeViewProps } from "../extensions/external-embed/components/node-view";
