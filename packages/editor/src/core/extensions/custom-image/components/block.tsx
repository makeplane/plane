import { NodeSelection } from "@tiptap/pm/state";
import React, { useRef, useState, useCallback, useLayoutEffect, useEffect } from "react";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { Pixel, TCustomImageAttributes, TCustomImageSize } from "../types";
import { ensurePixelString, getImageBlockId } from "../utils";
import type { CustomImageNodeViewProps } from "./node-view";
import { ImageToolbarRoot } from "./toolbar";
import { ImageUploadStatus } from "./upload-status";

const MIN_SIZE = 100;

type CustomImageBlockProps = CustomImageNodeViewProps & {
  editorContainer: HTMLDivElement | null;
  imageFromFileSystem: string | undefined;
  setEditorContainer: (editorContainer: HTMLDivElement | null) => void;
  setFailedToLoadImage: (isError: boolean) => void;
  src: string | undefined;
  downloadSrc: string | undefined;
};

export const CustomImageBlock: React.FC<CustomImageBlockProps> = (props) => {
  // props
  const {
    editor,
    editorContainer,
    extension,
    getPos,
    imageFromFileSystem,
    node,
    selected,
    setEditorContainer,
    setFailedToLoadImage,
    src: resolvedImageSrc,
    downloadSrc: resolvedDownloadSrc,
    updateAttributes,
  } = props;
  const {
    width: nodeWidth,
    height: nodeHeight,
    aspectRatio: nodeAspectRatio,
    src: imgNodeSrc,
    alignment: nodeAlignment,
  } = node.attrs;
  // states
  const [size, setSize] = useState<TCustomImageSize>({
    width: ensurePixelString(nodeWidth, "35%") ?? "35%",
    height: ensurePixelString(nodeHeight, "auto") ?? "auto",
    aspectRatio: nodeAspectRatio || null,
  });
  const [isResizing, setIsResizing] = useState(false);
  const [initialResizeComplete, setInitialResizeComplete] = useState(false);
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const containerRect = useRef<DOMRect | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [hasErroredOnFirstLoad, setHasErroredOnFirstLoad] = useState(false);
  const [hasTriedRestoringImageOnce, setHasTriedRestoringImageOnce] = useState(false);
  // extension options
  const isTouchDevice = !!editor.storage.utility.isTouchDevice;

  const updateAttributesSafely = useCallback(
    (attributes: Partial<TCustomImageAttributes>, errorMessage: string) => {
      try {
        updateAttributes(attributes);
      } catch (error) {
        console.error(`${errorMessage}:`, error);
      }
    },
    [updateAttributes]
  );

  const handleImageLoad = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;
    let closestEditorContainer: HTMLDivElement | null = null;

    if (editorContainer) {
      closestEditorContainer = editorContainer;
    } else {
      closestEditorContainer = img.closest(".editor-container") as HTMLDivElement | null;
      if (!closestEditorContainer) {
        console.error("Editor container not found");
        return;
      }
    }
    if (!closestEditorContainer) {
      console.error("Editor container not found");
      return;
    }

    setEditorContainer(closestEditorContainer);
    const aspectRatioCalculated = img.naturalWidth / img.naturalHeight;

    if (nodeWidth === "35%") {
      const editorWidth = closestEditorContainer.clientWidth;
      const initialWidth = Math.max(editorWidth * 0.35, MIN_SIZE);
      const initialHeight = initialWidth / aspectRatioCalculated;

      const initialComputedSize: TCustomImageSize = {
        width: `${Math.round(initialWidth)}px` satisfies Pixel,
        height: `${Math.round(initialHeight)}px` satisfies Pixel,
        aspectRatio: aspectRatioCalculated,
      };
      setSize(initialComputedSize);
      updateAttributesSafely(
        initialComputedSize,
        "Failed to update attributes while initializing an image for the first time:"
      );
    } else {
      // as the aspect ratio in not stored for old images, we need to update the attrs
      // or if aspectRatioCalculated from the image's width and height doesn't match stored aspectRatio then also we'll update the attrs
      if (!nodeAspectRatio || nodeAspectRatio !== aspectRatioCalculated) {
        setSize((prevSize) => {
          const newSize = { ...prevSize, aspectRatio: aspectRatioCalculated };
          updateAttributesSafely(
            newSize,
            "Failed to update attributes while initializing images with width but no aspect ratio:"
          );
          return newSize;
        });
      }
    }
    setInitialResizeComplete(true);
  }, [nodeWidth, updateAttributesSafely, editorContainer, nodeAspectRatio, setEditorContainer]);

  // for real time resizing
  useLayoutEffect(() => {
    setSize((prevSize) => ({
      ...prevSize,
      width: ensurePixelString(nodeWidth) ?? "35%",
      height: ensurePixelString(nodeHeight) ?? "auto",
      aspectRatio: nodeAspectRatio,
    }));
  }, [nodeWidth, nodeHeight, nodeAspectRatio]);

  const handleResize = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current || !containerRect.current || !size.aspectRatio) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;

      if (nodeAlignment === "right") {
        const newWidth = Math.max(containerRect.current.right - clientX, MIN_SIZE);
        const newHeight = newWidth / size.aspectRatio;
        setSize((prevSize) => ({ ...prevSize, width: `${newWidth}px`, height: `${newHeight}px` }));
      } else {
        const newWidth = Math.max(clientX - containerRect.current.left, MIN_SIZE);
        const newHeight = newWidth / size.aspectRatio;
        setSize((prevSize) => ({ ...prevSize, width: `${newWidth}px`, height: `${newHeight}px` }));
      }
    },
    [nodeAlignment, size.aspectRatio]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    updateAttributesSafely(size, "Failed to update attributes at the end of resizing:");
  }, [size, updateAttributesSafely]);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    if (containerRef.current) {
      containerRect.current = containerRef.current.getBoundingClientRect();
    }
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResize);
      window.addEventListener("mouseup", handleResizeEnd);
      window.addEventListener("mouseleave", handleResizeEnd);
      window.addEventListener("touchmove", handleResize);
      window.addEventListener("touchend", handleResizeEnd);

      return () => {
        window.removeEventListener("mousemove", handleResize);
        window.removeEventListener("mouseup", handleResizeEnd);
        window.removeEventListener("mouseleave", handleResizeEnd);
        window.removeEventListener("touchmove", handleResize);
        window.removeEventListener("touchend", handleResizeEnd);
      };
    }
  }, [isResizing, handleResize, handleResizeEnd]);

  const handleImageMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isTouchDevice) {
        e.preventDefault();
        editor.commands.blur();
      }
      const pos = getPos();
      if (pos === undefined) return;
      const nodeSelection = NodeSelection.create(editor.state.doc, pos);
      editor.view.dispatch(editor.state.tr.setSelection(nodeSelection));
    },
    [editor, getPos, isTouchDevice]
  );

  // show the image loader if the remote image's src or preview image from filesystem is not set yet (while loading the image post upload) (or)
  // if the initial resize (from 35% width and "auto" height attrs to the actual size in px) is not complete
  const showImageLoader = !(resolvedImageSrc || imageFromFileSystem) || !initialResizeComplete || hasErroredOnFirstLoad;
  // show the image upload status only when the resolvedImageSrc is not ready
  const showUploadStatus = !resolvedImageSrc;
  // show the image utils only if the remote image's (post upload) src is set and the initial resize is complete (but not while we're showing the preview imageFromFileSystem)
  const showImageToolbar = resolvedImageSrc && resolvedDownloadSrc && initialResizeComplete;
  // show the image resizer only if the editor is editable, the remote image's (post upload) src is set and the initial resize is complete (but not while we're showing the preview imageFromFileSystem)
  const showImageResizer = editor.isEditable && resolvedImageSrc && initialResizeComplete;
  // show the preview image from the file system if the remote image's src is not set
  const displayedImageSrc = resolvedImageSrc || imageFromFileSystem;

  return (
    <div
      id={getImageBlockId(node.attrs.id ?? "")}
      className={cn("w-fit max-w-full transition-all", {
        "ml-[50%] -translate-x-1/2": nodeAlignment === "center",
        "ml-[100%] -translate-x-full": nodeAlignment === "right",
      })}
    >
      <div
        ref={containerRef}
        className="group/image-component relative inline-block max-w-full"
        onMouseDown={handleImageMouseDown}
        style={{
          width: size.width,
          ...(size.aspectRatio && { aspectRatio: size.aspectRatio }),
        }}
      >
        {showImageLoader && (
          <div
            className="animate-pulse bg-custom-background-80 rounded-md"
            style={{ width: size.width, height: size.height }}
          />
        )}
        <img
          ref={imageRef}
          src={displayedImageSrc}
          onLoad={handleImageLoad}
          onError={async (e) => {
            // for old image extension this command doesn't exist or if the image failed to load for the first time
            if (!extension.options.restoreImage || hasTriedRestoringImageOnce) {
              setFailedToLoadImage(true);
              return;
            }

            try {
              setHasErroredOnFirstLoad(true);
              // this is a type error from tiptap, don't remove await until it's fixed
              if (!imgNodeSrc) {
                throw new Error("No source image to restore from");
              }
              await extension.options.restoreImage?.(imgNodeSrc);
              if (!imageRef.current) {
                throw new Error("Image reference not found");
              }
              if (!resolvedImageSrc) {
                throw new Error("No resolved image source available");
              }
              if (isTouchDevice) {
                const refreshedSrc = await extension.options.getImageSource?.(imgNodeSrc);
                imageRef.current.src = refreshedSrc;
              } else {
                imageRef.current.src = resolvedImageSrc;
              }
            } catch {
              // if the image failed to even restore, then show the error state
              setFailedToLoadImage(true);
              console.error("Error while loading image", e);
            } finally {
              setHasErroredOnFirstLoad(false);
              setHasTriedRestoringImageOnce(true);
            }
          }}
          width={size.width}
          className={cn("image-component block rounded-md", {
            // hide the image while the background calculations of the image loader are in progress (to avoid flickering) and show the loader until then
            hidden: showImageLoader,
            "read-only-image": !editor.isEditable,
            "blur-sm opacity-80 loading-image": !resolvedImageSrc,
          })}
          style={{
            width: size.width,
            ...(size.aspectRatio && { aspectRatio: size.aspectRatio }),
          }}
        />
        {showUploadStatus && node.attrs.id && <ImageUploadStatus editor={editor} nodeId={node.attrs.id} />}
        {showImageToolbar && (
          <ImageToolbarRoot
            alignment={nodeAlignment ?? "left"}
            editor={editor}
            aspectRatio={size.aspectRatio === null ? 1 : size.aspectRatio}
            downloadSrc={resolvedDownloadSrc}
            handleAlignmentChange={(alignment) =>
              updateAttributesSafely({ alignment }, "Failed to update attributes while changing alignment:")
            }
            height={size.height}
            isTouchDevice={isTouchDevice}
            width={size.width}
            src={resolvedImageSrc}
          />
        )}
        {selected && displayedImageSrc === resolvedImageSrc && (
          <div className="absolute inset-0 size-full bg-custom-primary-500/30 pointer-events-none" />
        )}
        {showImageResizer && (
          <>
            <div
              className={cn(
                "absolute inset-0 border-2 border-custom-primary-100 pointer-events-none rounded-md transition-opacity duration-100 ease-in-out",
                {
                  "opacity-100": isResizing,
                  "opacity-0 group-hover/image-component:opacity-100": !isResizing,
                }
              )}
            />
            <div
              className={cn(
                "absolute bottom-0 translate-y-1/2 size-4 rounded-full bg-custom-primary-100 border-2 border-white transition-opacity duration-100 ease-in-out",
                {
                  "opacity-100 pointer-events-auto": isResizing,
                  "opacity-0 pointer-events-none group-hover/image-component:opacity-100 group-hover/image-component:pointer-events-auto":
                    !isResizing,
                  "left-0 -translate-x-1/2 cursor-nesw-resize": nodeAlignment === "right",
                  "right-0 translate-x-1/2 cursor-nwse-resize": nodeAlignment !== "right",
                }
              )}
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
            />
          </>
        )}
      </div>
    </div>
  );
};
