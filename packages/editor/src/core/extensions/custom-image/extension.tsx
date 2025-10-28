import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
// constants
import { ACCEPTED_IMAGE_MIME_TYPES } from "@/constants/config";
// helpers
import { isFileValid } from "@/helpers/file";
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// types
import type { TFileHandler } from "@/types";
// local imports
import { CustomImageNodeView, CustomImageNodeViewProps } from "./components/node-view";
import { CustomImageExtensionConfig } from "./extension-config";
import type { CustomImageExtensionOptions, CustomImageExtensionStorage } from "./types";
import { getImageComponentImageFileMap } from "./utils";

type Props = {
  fileHandler: TFileHandler;
  isEditable: boolean;
};

export const CustomImageExtension = (props: Props) => {
  const { fileHandler, isEditable } = props;
  // derived values
  const { getAssetSrc, getAssetDownloadSrc, restore: restoreImageFn } = fileHandler;

  return CustomImageExtensionConfig.extend<CustomImageExtensionOptions, CustomImageExtensionStorage>({
    selectable: isEditable,
    draggable: isEditable,

    addOptions() {
      const upload = "upload" in fileHandler ? fileHandler.upload : undefined;
      const duplicate = "duplicate" in fileHandler ? fileHandler.duplicate : undefined;
      return {
        ...this.parent?.(),
        getImageDownloadSource: getAssetDownloadSrc,
        getImageSource: getAssetSrc,
        restoreImage: restoreImageFn,
        uploadImage: upload,
        duplicateImage: duplicate,
      };
    },

    addStorage() {
      const maxFileSize = "validation" in fileHandler ? fileHandler.validation?.maxFileSize : 0;

      return {
        fileMap: new Map(),
        deletedImageSet: new Map<string, boolean>(),
        maxFileSize,
        // escape markdown for images
        markdown: {
          serialize() {},
        },
      };
    },

    addCommands() {
      return {
        insertImageComponent:
          (props) =>
          ({ commands }) => {
            // Early return if there's an invalid file being dropped
            if (
              props?.file &&
              !isFileValid({
                acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
                file: props.file,
                maxFileSize: this.storage.maxFileSize,
                onError: (_error, message) => alert(message),
              })
            ) {
              return false;
            }

            // generate a unique id for the image to keep track of dropped
            // files' file data
            const fileId = uuidv4();

            const imageComponentImageFileMap = getImageComponentImageFileMap(this.editor);

            if (imageComponentImageFileMap) {
              if (props?.event === "drop" && props.file) {
                imageComponentImageFileMap.set(fileId, {
                  file: props.file,
                  event: props.event,
                });
              } else if (props.event === "insert") {
                imageComponentImageFileMap.set(fileId, {
                  event: props.event,
                  hasOpenedFileInputOnce: false,
                });
              }
            }

            const attributes = {
              id: fileId,
              status: "pending",
            };

            if (props.pos) {
              return commands.insertContentAt(props.pos, {
                type: this.name,
                attrs: attributes,
              });
            }
            return commands.insertContent({
              type: this.name,
              attrs: attributes,
            });
          },
      };
    },

    addKeyboardShortcuts() {
      return {
        ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
        ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
      };
    },
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey("paste-image-duplication"),
          props: {
            handlePaste: (view, event, _slice) => {
              if (!event.clipboardData) return false;

              const htmlContent = event.clipboardData.getData("text/html");
              if (!htmlContent || htmlContent.includes('data-duplicated="true"')) return false;

              const tempDiv = document.createElement("div");
              tempDiv.innerHTML = htmlContent;
              const imageComponents = tempDiv.querySelectorAll("image-component");

              if (imageComponents.length === 0) return false;

              event.preventDefault();
              event.stopPropagation();

              let updatedHtml = htmlContent;
              imageComponents.forEach((component) => {
                const src = component.getAttribute("src");
                if (src) {
                  const newId = uuidv4();
                  const originalTag = component.outerHTML;
                  const modifiedTag = originalTag
                    .replace(`<image-component`, `<image-component status="duplicating"`)
                    .replace(/id="[^"]*"/, `id="${newId}"`);
                  updatedHtml = updatedHtml.replace(originalTag, modifiedTag);
                }
              });

              updatedHtml = updatedHtml.replace(
                "<meta charset='utf-8'>",
                "<meta charset='utf-8' data-duplicated=\"true\">"
              );

              const newDataTransfer = new DataTransfer();
              newDataTransfer.setData("text/html", updatedHtml);
              if (event.clipboardData) {
                newDataTransfer.setData("text/plain", event.clipboardData.getData("text/plain"));
              }

              const pasteEvent = new ClipboardEvent("paste", {
                clipboardData: newDataTransfer,
                bubbles: true,
                cancelable: true,
              });

              view.dom.dispatchEvent(pasteEvent);

              return true;
            },
          },
        }),
      ];
    },

    addNodeView() {
      return ReactNodeViewRenderer((props) => (
        <CustomImageNodeView {...props} node={props.node as CustomImageNodeViewProps["node"]} />
      ));
    },
  });
};
