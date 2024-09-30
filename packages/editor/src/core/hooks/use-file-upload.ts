import { DragEvent, useCallback, useEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/core";
import { isFileValid } from "@/plugins/image";

export const useUploader = ({ onUpload, editor }: { onUpload: (url: string) => void; editor: Editor }) => {
  const [loading, setLoading] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        // @ts-expect-error - TODO: fix typings, and don't remove await from
        // here for now
        const url: string = await editor?.commands.uploadImage(file);

        if (!url) {
          throw new Error("Something went wrong while uploading the image");
        }
        onUpload(url);
      } catch (errPayload: any) {
        console.log(errPayload);
        const error = errPayload?.response?.data?.error || "Something went wrong";
        console.error(error);
      }
      setLoading(false);
    },
    [onUpload, editor]
  );

  return { loading, uploadFile };
};

export const useFileUpload = () => {
  const fileInput = useRef<HTMLInputElement>(null);

  const handleUploadClick = useCallback(() => {
    fileInput.current?.click();
  }, []);

  return { ref: fileInput, handleUploadClick };
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
        const isValid = isFileValid(file);
        if (isValid) {
          uploader(file);
        }
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
