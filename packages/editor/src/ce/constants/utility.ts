import { CORE_EXTENSIONS } from "@/constants/extension";
import { ExtensionFileSetStorageKey } from "@/plane-editor/types/storage";

export const NODE_FILE_MAP: Partial<
  Record<
    CORE_EXTENSIONS,
    {
      fileSetName: ExtensionFileSetStorageKey;
    }
  >
> = {
  [CORE_EXTENSIONS.IMAGE]: {
    fileSetName: "deletedImageSet",
  },
  [CORE_EXTENSIONS.CUSTOM_IMAGE]: {
    fileSetName: "deletedImageSet",
  },
};
