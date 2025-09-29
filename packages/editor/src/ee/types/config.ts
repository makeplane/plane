export type TExtendedFileHandler = {
  reupload?: (blockId: string, file: File, assetSrc: string) => Promise<string>;
  getFileContent?: (src: string) => Promise<string>;
};
