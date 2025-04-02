import { Editor } from "@tiptap/core";
import {
  CustomLinkStorage,
  HeadingExtensionStorage,
  MentionExtensionStorage,
  UploadImageExtensionStorage,
} from "@/extensions";
import { ImageExtensionStorage } from "@/plugins/image";

type ExtensionNames = "imageComponent" | "image" | "link" | "headingList" | "mention";

interface ExtensionStorageMap {
  imageComponent: UploadImageExtensionStorage;
  image: ImageExtensionStorage;
  link: CustomLinkStorage;
  headingList: HeadingExtensionStorage;
  mention: MentionExtensionStorage;
}

export const getExtensionStorage = <K extends ExtensionNames>(
  editor: Editor,
  extensionName: K
): ExtensionStorageMap[K] => editor.storage[extensionName];
