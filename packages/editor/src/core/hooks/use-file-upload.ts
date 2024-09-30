import { DragEvent, useCallback, useEffect, useState } from "react";
import { Editor } from "@tiptap/core";
import { isFileValid } from "@/plugins/image";

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

export const useDropZone = ({ uploader }: { uploader: (file: File) => void }) => {
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
    (e: DragEvent<HTMLDivElement>) => {
      setDraggedInside(false);
      if (e.dataTransfer.files.length === 0) {
        return;
      }

      const fileList = e.dataTransfer.files;

      const files: File[] = [];

      for (let i = 0; i < fileList.length; i += 1) {
        const item = fileList.item(i);
        if (item) {
          files.push(item);
        }
      }

      if (files.some((file) => file.type.indexOf("image") === -1)) {
        return;
      }

      e.preventDefault();

      const filteredFiles = files.filter((f) => f.type.indexOf("image") !== -1);

      const file = filteredFiles.length > 0 ? filteredFiles[0] : undefined;

      if (file) {
        uploader(file);
      } else {
        console.error("No file found");
      }
    },
    [uploader]
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
