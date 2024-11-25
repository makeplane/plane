export enum EEmbedAttributeNames {
  SOURCE = "src",
  WIDTH = "width",
  BLOCK_TYPE = "data-block-type",
}

export type TEmbedBlockAttributes = {
  [EEmbedAttributeNames.SOURCE]: string | undefined;
  [EEmbedAttributeNames.WIDTH]: string | number | undefined;
  [EEmbedAttributeNames.BLOCK_TYPE]: "embed-component";
};
