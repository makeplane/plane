// Core Enums
export enum EExternalEmbedEntityType {
  EMBED = "embed",
  RICH_CARD = "rich_card",
}

export enum EExternalEmbedAttributeNames {
  SOURCE = "src",
  ID = "id",
  EMBED_DATA = "embed_data",
  IS_RICH_CARD = "is_rich_card",
  HAS_EMBED_FAILED = "has_embed_failed",
  HAS_TRIED_EMBEDDING = "has_tried_embedding",
  ENTITY_NAME = "entity_name",
  ENTITY_TYPE = "entity_type",
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
