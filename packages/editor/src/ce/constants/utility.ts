import { ExtensionFileSetStorageKey } from "../types/storage";

export const NODE_FILE_MAP: {
  [key: string]: {
    fileSetName: ExtensionFileSetStorageKey;
  };
} = {
  image: {
    fileSetName: "deletedImageSet",
  },
  imageComponent: {
    fileSetName: "deletedImageSet",
  },
};
