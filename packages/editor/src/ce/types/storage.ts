// extensions
import type { ImageExtensionStorage } from "@/extensions/image";

export type ExtensionFileSetStorageKey = Extract<keyof ImageExtensionStorage, "deletedImageSet">;
