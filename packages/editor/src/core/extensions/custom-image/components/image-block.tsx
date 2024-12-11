import React, { useRef, useState, useCallback, useLayoutEffect, useEffect } from "react";
import { NodeSelection } from "@tiptap/pm/state";
// extensions
import { CustoBaseImageNodeViewProps, ImageToolbarRoot } from "@/extensions/custom-image";
// helpers
import { cn } from "@/helpers/common";

const MIN_SIZE = 100;

type Pixel = `${number}px`;

type PixelAttribute<TDefault> = Pixel | TDefault;

export type ImageAttributes = {
  src: string | null;
  width: PixelAttribute<"35%" | number>;
  height: PixelAttribute<"auto" | number>;
  aspectRatio: number | null;
  id: string | null;
};

type Size = {
  width: PixelAttribute<"35%">;
  height: PixelAttribute<"auto">;
  aspectRatio: number | null;
};

const ensurePixelString = <TDefault,>(value: Pixel | TDefault | number | undefined | null, defaultValue?: TDefault) => {
  if (!value || value === defaultValue) {
    return defaultValue;
  }

  if (typeof value === "number") {
    return `${value}px` satisfies Pixel;
  }

  return value;
};

type CustomImageBlockProps = CustoBaseImageNodeViewProps & {
  imageFromFileSystem: string;
  setFailedToLoadImage: (isError: boolean) => void;
  editorContainer: HTMLDivElement | null;
  setEditorContainer: (editorContainer: HTMLDivElement | null) => void;
  src: string;
};

export const CustomImageBlock: React.FC<CustomImageBlockProps> = (props) => {
  // props
  const {
    node,
    updateAttributes,
    setFailedToLoadImage,
    imageFromFileSystem,
    selected,
    getPos,
    editor,
    editorContainer,
    src: resolvedImageSrc,
    setEditorContainer,
  } = props;
  const { width: nodeWidth, height: nodeHeight, aspectRatio: nodeAspectRatio, src: imgNodeSrc } = node.attrs;
  // states
  const [size, setSize] = useState<Size>({
    width: ensurePixelString(nodeWidth, "35%"),
    height: ensurePixelString(nodeHeight, "auto"),
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

  const updateAttributesSafely = useCallback(
    (attributes: Partial<ImageAttributes>, errorMessage: string) => {
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

      const initialComputedSize = {
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
  }, [nodeWidth, updateAttributes, editorContainer, nodeAspectRatio]);

  // for real time resizing
  useLayoutEffect(() => {
    setSize((prevSize) => ({
      ...prevSize,
      width: ensurePixelString(nodeWidth),
      height: ensurePixelString(nodeHeight),
      aspectRatio: nodeAspectRatio,
    }));
  }, [nodeWidth, nodeHeight, nodeAspectRatio]);

  const handleResize = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current || !containerRect.current || !size.aspectRatio) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;

      const newWidth = Math.max(clientX - containerRect.current.left, MIN_SIZE);
      const newHeight = newWidth / size.aspectRatio;

      setSize((prevSize) => ({ ...prevSize, width: `${newWidth}px`, height: `${newHeight}px` }));
    },
    [size.aspectRatio]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    updateAttributesSafely(size, "Failed to update attributes at the end of resizing:");
  }, [size, updateAttributes]);

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
      const pos = getPos();
      const nodeSelection = NodeSelection.create(editor.state.doc, pos);
      editor.view.dispatch(editor.state.tr.setSelection(nodeSelection));
    },
    [editor, getPos]
  );

  // show the image loader if the remote image's src or preview image from filesystem is not set yet (while loading the image post upload) (or)
  // if the initial resize (from 35% width and "auto" height attrs to the actual size in px) is not complete
  const showImageLoader = !(resolvedImageSrc || imageFromFileSystem) || !initialResizeComplete || hasErroredOnFirstLoad;
  // show the image utils only if the remote image's (post upload) src is set and the initial resize is complete (but not while we're showing the preview imageFromFileSystem)
  const showImageUtils = resolvedImageSrc && initialResizeComplete;
  // show the image resizer only if the editor is editable, the remote image's (post upload) src is set and the initial resize is complete (but not while we're showing the preview imageFromFileSystem)
  const showImageResizer = editor.isEditable && resolvedImageSrc && initialResizeComplete;
  // show the preview image from the file system if the remote image's src is not set
  const displayedImageSrc = resolvedImageSrc || imageFromFileSystem;

  return (
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
          if (!editor?.commands.restoreImage || hasTriedRestoringImageOnce) {
            setFailedToLoadImage(true);
            return;
          }

          try {
            setHasErroredOnFirstLoad(true);
            // this is a type error from tiptap, don't remove await until it's fixed
            await editor?.commands.restoreImage?.(imgNodeSrc);
            imageRef.current.src = resolvedImageSrc;
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
      {showImageUtils && (
        <ImageToolbarRoot
          containerClassName={
            "absolute top-1 right-1 z-20 bg-black/40 rounded opacity-0 pointer-events-none group-hover/image-component:opacity-100 group-hover/image-component:pointer-events-auto transition-opacity"
          }
          image={{
            src: resolvedImageSrc,
            aspectRatio: size.aspectRatio,
            height: size.height,
            width: size.width,
          }}
        />
      )}
      {selected && displayedImageSrc === resolvedImageSrc && (
        <div className="absolute inset-0 size-full bg-custom-primary-500/30" />
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
              "absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 size-4 rounded-full bg-custom-primary-100 border-2 border-white cursor-nwse-resize transition-opacity duration-100 ease-in-out",
              {
                "opacity-100 pointer-events-auto": isResizing,
                "opacity-0 pointer-events-none group-hover/image-component:opacity-100 group-hover/image-component:pointer-events-auto":
                  !isResizing,
              }
            )}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
          />
        </>
      )}
    </div>
  );
};
