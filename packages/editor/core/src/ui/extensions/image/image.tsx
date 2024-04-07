import { NodeViewWrapper, type NodeViewProps, ReactNodeViewRenderer, mergeAttributes } from "@tiptap/react";
import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
import ImageExt from "@tiptap/extension-image";
import { DeleteImage } from "src/types/delete-image";
import { RestoreImage } from "src/types/restore-image";
import { onNodeDeleted, onNodeRestored } from "src/ui/plugins/delete-image";
import { UploadImagesPlugin } from "src/ui/plugins/upload-image";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";

interface ImageNode extends ProseMirrorNode {
  attrs: {
    src: string;
    id: string;
  };
}

const deleteKey = new PluginKey("delete-image");
const IMAGE_NODE_TYPE = "image";
const useEvent = <T extends (...args: any[]) => any>(handler: T): T => {
  const handlerRef = useRef<T | null>(null);

  useLayoutEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  return useCallback((...args: Parameters<T>): ReturnType<T> => {
    if (handlerRef.current === null) {
      throw new Error("Handler is not assigned");
    }
    return handlerRef.current(...args);
  }, []) as T;
};

const MIN_WIDTH = 60;
const BORDER_COLOR = "#0096fd";

export const ResizableImageTemplate = ({ node, updateAttributes, getAsset }: NodeViewProps & { getAsset: any }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [editing, setEditing] = useState(false);
  const [resizingStyle, setResizingStyle] = useState<Pick<CSSProperties, "width"> | undefined>();

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setEditing(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [editing]);

  const [src, setSrc] = useState("");

  useEffect(() => {
    const fetchImageBlob = async () => {
      setLoading(true); // Start loading
      try {
        const blob = await getAsset?.(node.attrs.assetId);
        const imageUrl = URL.createObjectURL(blob);
        setSrc(imageUrl);
      } catch (error) {
        console.error("Error fetching image:", error);
      } finally {
        setLoading(false); // Stop loading regardless of the outcome
      }
    };
    if (node.attrs.assetId) {
      fetchImageBlob();
    }
  }, [node.attrs.assetId, getAsset]);

  const handleMouseDown = useEvent((event: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    event.preventDefault();
    const direction = event.currentTarget.dataset.direction || "--";
    const initialXPosition = event.clientX;
    const currentWidth = imgRef.current.width;
    let newWidth = currentWidth;
    const transform = direction[1] === "w" ? -1 : 1;

    const removeListeners = () => {
      window.removeEventListener("mousemove", mouseMoveHandler);
      window.removeEventListener("mouseup", removeListeners);
      updateAttributes({ width: newWidth });
      setResizingStyle(undefined);
    };

    const mouseMoveHandler = (event: MouseEvent) => {
      newWidth = Math.max(currentWidth + transform * (event.clientX - initialXPosition), MIN_WIDTH);
      setResizingStyle({ width: newWidth });
      // If mouse is up, remove event listeners
      if (!event.buttons) removeListeners();
    };

    window.addEventListener("mousemove", mouseMoveHandler);
    window.addEventListener("mouseup", removeListeners);
  });

  const dragCornerButton = (direction: string) => (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={handleMouseDown}
      data-direction={direction}
      style={{
        position: "absolute",
        height: "10px",
        width: "10px",
        backgroundColor: BORDER_COLOR,
        ...{ n: { top: 0 }, s: { bottom: 0 } }[direction[0]],
        ...{ w: { left: 0 }, e: { right: 0 } }[direction[1]],
        cursor: `${direction}-resize`,
      }}
    />
  );
  console.log("image node", loading);
  return (
    <NodeViewWrapper
      ref={containerRef}
      as="div"
      className="image-component"
      draggable={true}
      data-drag-handle
      onClick={() => setEditing(true)}
      onBlur={() => setEditing(false)}
    >
      <div
        style={{
          overflow: "hidden",
          position: "relative",
          display: "inline-block",
          // Weird! Basically tiptap/prose wraps this in a span and the line height causes an annoying buffer.
          lineHeight: "0px",
        }}
      >
        {loading ? (
          <div className="flex justify-center items-center w-48 h-32 border border-custom-border-400">
            {/* Example loading spinner using Tailwind CSS */}
            <div role="status">
              <svg
                aria-hidden="true"
                className="inline w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <img
            {...node.attrs}
            src={src}
            ref={imgRef}
            style={{
              ...resizingStyle,
              cursor: "default",
              width: "35%%",
            }}
            alt=""
          />
        )}
        {editing && (
          <>
            {[
              { left: 0, top: 0, height: "100%", width: "1px" },
              { right: 0, top: 0, height: "100%", width: "1px" },
              { top: 0, left: 0, width: "100%", height: "1px" },
              { bottom: 0, left: 0, width: "100%", height: "1px" },
            ].map((style, i) => (
              <div key={i} style={{ position: "absolute", backgroundColor: BORDER_COLOR, ...style }} />
            ))}
            {dragCornerButton("nw")}
            {dragCornerButton("ne")}
            {dragCornerButton("sw")}
            {dragCornerButton("se")}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ImageExtension = (
  deleteImage: DeleteImage,
  restoreFile: RestoreImage,
  cancelUploadImage?: () => any,
  getAsset?: any
) =>
  ImageExt.extend({
    addProseMirrorPlugins() {
      return [
        UploadImagesPlugin(cancelUploadImage),
        new Plugin({
          key: deleteKey,
          appendTransaction: (transactions: readonly Transaction[], oldState: EditorState, newState: EditorState) => {
            const newImageSources = new Set<string>();
            newState.doc.descendants((node) => {
              if (node.type.name === IMAGE_NODE_TYPE) {
                newImageSources.add(node.attrs.src);
              }
            });

            transactions.forEach((transaction) => {
              // transaction could be a selection
              if (!transaction.docChanged) return;

              const removedImages: ImageNode[] = [];

              // iterate through all the nodes in the old state
              oldState.doc.descendants((oldNode) => {
                // if the node is not an image, then return as no point in checking
                if (oldNode.type.name !== IMAGE_NODE_TYPE) return;

                // Check if the node has been deleted or replaced
                if (!newImageSources.has(oldNode.attrs.src)) {
                  removedImages.push(oldNode as ImageNode);
                }
              });

              removedImages.forEach(async (node) => {
                const src = node.attrs.src;
                this.storage.images.set(src, true);
                await onNodeDeleted(src, deleteImage);
              });
            });

            return null;
          },
        }),
        new Plugin({
          key: new PluginKey("imageRestoration"),
          appendTransaction: (transactions: readonly Transaction[], oldState: EditorState, newState: EditorState) => {
            const oldImageSources = new Set<string>();
            oldState.doc.descendants((node) => {
              if (node.type.name === IMAGE_NODE_TYPE) {
                oldImageSources.add(node.attrs.src);
              }
            });

            transactions.forEach((transaction) => {
              if (!transaction.docChanged) return;

              const addedImages: ImageNode[] = [];

              newState.doc.descendants((node, pos) => {
                if (node.type.name !== IMAGE_NODE_TYPE) return;
                if (pos < 0 || pos > newState.doc.content.size) return;
                if (oldImageSources.has(node.attrs.src)) return;
                addedImages.push(node as ImageNode);
              });

              addedImages.forEach(async (image) => {
                const wasDeleted = this.storage.images.get(image.attrs.src);
                if (wasDeleted === undefined) {
                  this.storage.images.set(image.attrs.src, false);
                } else if (wasDeleted === true) {
                  await onNodeRestored(image.attrs.src, restoreFile);
                }
              });
            });
            return null;
          },
        }),
      ];
    },

    onCreate(this) {
      const imageSources = new Set<string>();
      this.editor.state.doc.descendants((node) => {
        if (node.type.name === IMAGE_NODE_TYPE) {
          imageSources.add(node.attrs.src);
        }
      });
      imageSources.forEach(async (src) => {
        try {
          const assetUrlWithWorkspaceId = new URL(src).pathname.substring(1);
          await restoreFile(assetUrlWithWorkspaceId);
        } catch (error) {
          console.error("Error restoring image: ", error);
        }
      });
    },

    // storage to keep track of image states Map<src, isDeleted>
    addStorage() {
      return {
        images: new Map<string, boolean>(),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer((props: Object) => <ResizableImageTemplate {...props} getAsset={getAsset} />);
    },

    parseHTML() {
      return [
        {
          tag: "image-component", // Assuming your images are represented by <img> tags with a specific attribute
          getAttrs: (node: string | HTMLElement) => {
            if (typeof node === "string") {
              return null;
            }
            return {
              assetId: node.getAttribute("assetId") || null,
              src: node.getAttribute("src"),
              alt: node.getAttribute("alt") || "",
              title: node.getAttribute("title") || "",
            };
          },
        },
      ];
    },

    draggable: true,
    renderHTML({ HTMLAttributes }) {
      return ["image-component", mergeAttributes(HTMLAttributes)];
    },
    addAttributes() {
      return {
        // ...this.parent?.(),
        assetId: {
          default: null,
        },
        width: {
          default: "35%",
        },
        height: {
          default: null,
        },
      };
    },
  }).configure({ inline: true });
