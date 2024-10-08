import { DragEvent, useCallback, useEffect, useState } from "react";
import { Editor } from "@tiptap/core";
import { isFileValid } from "@/plugins/image";
import { insertImagesSafely } from "@/extensions/drop";

export const useUploader = ({
  onUpload,
  editor,
  loadImageFromFileSystem,
}: {
  onUpload: (url: string) => void;
  editor: Editor;
  loadImageFromFileSystem: (file: string) => void;
}) => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      const setImageUploadInProgress = (isUploading: boolean) => {
        editor.storage.imageComponent.uploadInProgress = isUploading;
      };
      setImageUploadInProgress(true);
      setUploading(true);
      const fileNameTrimmed = trimFileName(file.name);
      const fileWithTrimmedName = new File([file], fileNameTrimmed, { type: file.type });
      const isValid = isFileValid(fileWithTrimmedName);
      if (!isValid) {
        setImageUploadInProgress(false);
        return;
      }
      try {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            loadImageFromFileSystem(reader.result as string);
          } else {
            console.error("Failed to read the file: reader.result is null");
          }
        };
        reader.onerror = () => {
          console.error("Error reading file");
        };
        reader.readAsDataURL(fileWithTrimmedName);
        // @ts-expect-error - TODO: fix typings, and don't remove await from
        // here for now
        const url: string = await editor?.commands.uploadImage(fileWithTrimmedName);

        if (!url) {
          throw new Error("Something went wrong while uploading the image");
        }
        onUpload(url);
      } catch (errPayload: any) {
        console.log(errPayload);
        const error = errPayload?.response?.data?.error || "Something went wrong";
        console.error(error);
      } finally {
        setImageUploadInProgress(false);
        setUploading(false);
      }
    },
    [onUpload]
  );

  return { uploading, uploadFile };
};

export const useDropZone = ({
  uploader,
  editor,
  pos,
}: {
  uploader: (file: File) => Promise<void>;
  editor: Editor;
  pos: number;
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedInside, setDraggedInside] = useState<boolean>(false);

  useEffect(() => {
    const dragStartHandler = () => {
      setIsDragging(true);
    };

    const dragEndHandler = () => {
      setIsDragging(false);
    };

    document.body.addEventListener("dragstart", dragStartHandler);
    document.body.addEventListener("dragend", dragEndHandler);

    return () => {
      document.body.removeEventListener("dragstart", dragStartHandler);
      document.body.removeEventListener("dragend", dragEndHandler);
    };
  }, []);

  const onDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDraggedInside(false);
      if (e.dataTransfer.files.length === 0) {
        return;
      }
      const fileList = e.dataTransfer.files;
      await uploadFirstImageAndInsertRemaining(editor, fileList, pos, uploader);
    },
    [uploader, editor, pos]
  );

  const onDragEnter = () => {
    setDraggedInside(true);
  };

  const onDragLeave = () => {
    setDraggedInside(false);
  };

  return { isDragging, draggedInside, onDragEnter, onDragLeave, onDrop };
};

function trimFileName(fileName: string, maxLength = 100) {
  if (fileName.length > maxLength) {
    const extension = fileName.split(".").pop();
    const nameWithoutExtension = fileName.slice(0, -(extension?.length ?? 0 + 1));
    const allowedNameLength = maxLength - (extension?.length ?? 0) - 1; // -1 for the dot
    return `${nameWithoutExtension.slice(0, allowedNameLength)}.${extension}`;
  }

  return fileName;
}

// Upload the first image and insert the remaining images for uploading multiple image
// post insertion of image-component
export async function uploadFirstImageAndInsertRemaining(
  editor: Editor,
  fileList: FileList,
  pos: number,
  uploaderFn: (file: File) => Promise<void>
) {
  const filteredFiles: File[] = [];
  for (let i = 0; i < fileList.length; i += 1) {
    const item = fileList.item(i);
    if (item && item.type.indexOf("image") !== -1 && isFileValid(item)) {
      filteredFiles.push(item);
    }
  }
  if (filteredFiles.length !== fileList.length) {
    console.warn("Some files were not images and have been ignored.");
  }
  if (filteredFiles.length === 0) {
    console.error("No image files found to upload");
    return;
  }

  // Upload the first image
  const firstFile = filteredFiles[0];
  uploaderFn(firstFile);

  // Insert the remaining images
  const remainingFiles = filteredFiles.slice(1);

  if (remainingFiles.length > 0) {
    const docSize = editor.state.doc.content.size;
    const posOfNextImageToBeInserted = Math.min(pos + 1, docSize);
    insertImagesSafely({ editor, files: remainingFiles, initialPos: posOfNextImageToBeInserted, event: "drop" });
  }
}
