import { EExternalEmbedAttributeNames, EExternalEmbedEntityType, TExternalEmbedBlockAttributes } from "@/types";

export const DEFAULT_EXTERNAL_EMBED_ATTRIBUTES: TExternalEmbedBlockAttributes = {
  [EExternalEmbedAttributeNames.SOURCE]: null,
  [EExternalEmbedAttributeNames.ID]: null,
  [EExternalEmbedAttributeNames.EMBED_DATA]: null,
  [EExternalEmbedAttributeNames.IS_RICH_CARD]: false,
  [EExternalEmbedAttributeNames.HAS_EMBED_FAILED]: false,
  [EExternalEmbedAttributeNames.ENTITY_NAME]: null,
  [EExternalEmbedAttributeNames.ENTITY_TYPE]: EExternalEmbedEntityType.EMBED,
  [EExternalEmbedAttributeNames.HAS_TRIED_EMBEDDING]: false,
};
