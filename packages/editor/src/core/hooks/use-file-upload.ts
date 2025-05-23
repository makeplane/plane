import { Editor } from "@tiptap/core";
import { DragEvent, useCallback, useEffect, useState } from "react";
// helpers
import { EFileError, isFileValid } from "@/helpers/file";
// plugins
import { insertFilesSafely } from "@/plugins/drop";
// types
import { TEditorCommands } from "@/types";

type TUploaderArgs = {
  acceptedMimeTypes: string[];
  editorCommand: (file: File) => Promise<string>;
  handleProgressStatus?: (isUploading: boolean) => void;
  loadFileFromFileSystem?: (file: string) => void;
  maxFileSize: number;
  onInvalidFile: (error: EFileError, message: string) => void;
  onUpload: (url: string, file: File) => void;
};

export const useUploader = (args: TUploaderArgs) => {
  const {
    acceptedMimeTypes,
    editorCommand,
    handleProgressStatus,
    loadFileFromFileSystem,
    maxFileSize,
    onInvalidFile,
    onUpload,
  } = args;
  // states
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      handleProgressStatus?.(true);
      setIsUploading(true);
      const isValid = isFileValid({
        acceptedMimeTypes,
        file,
        maxFileSize,
        onError: onInvalidFile,
      });
      if (!isValid) {
        handleProgressStatus?.(false);
        setIsUploading(false);
        return;
      }
      try {
        if (loadFileFromFileSystem) {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              loadFileFromFileSystem(reader.result as string);
            } else {
              console.error("Failed to read the file: reader.result is null");
            }
          };
          reader.onerror = () => {
            console.error("Error reading file");
          };
          reader.readAsDataURL(file);
        }
        const url: string = await editorCommand(file);

        if (!url) {
          throw new Error("Something went wrong while uploading the file.");
        }
        onUpload(url, file);
      } catch (errPayload) {
        const error = errPayload?.response?.data?.error || "Something went wrong";
        console.error(error);
      } finally {
        handleProgressStatus?.(false);
        setIsUploading(false);
      }
    },
    [acceptedMimeTypes, editorCommand, handleProgressStatus, loadFileFromFileSystem, maxFileSize, onUpload]
  );

  return { isUploading, uploadFile };
};

type TDropzoneArgs = {
  acceptedMimeTypes: string[];
  editor: Editor;
  maxFileSize: number;
  onInvalidFile: (error: EFileError, message: string) => void;
  pos: number;
  type: Extract<TEditorCommands, "attachment" | "image">;
  uploader: (file: File) => Promise<void>;
};

export const useDropZone = (args: TDropzoneArgs) => {
  const { acceptedMimeTypes, editor, maxFileSize, onInvalidFile, pos, type, uploader } = args;
  // states
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
      if (e.dataTransfer.files.length === 0 || !editor.isEditable) {
        return;
      }
      const filesList = e.dataTransfer.files;
      await uploadFirstFileAndInsertRemaining({
        acceptedMimeTypes,
        editor,
        filesList,
        maxFileSize,
        onInvalidFile,
        pos,
        type,
        uploader,
      });
    },
    [acceptedMimeTypes, editor, maxFileSize, onInvalidFile, pos, type, uploader]
  );
  const onDragEnter = useCallback(() => setDraggedInside(true), []);
  const onDragLeave = useCallback(() => setDraggedInside(false), []);

  return {
    isDragging,
    draggedInside,
    onDragEnter,
    onDragLeave,
    onDrop,
  };
};

type TMultipleFileArgs = {
  acceptedMimeTypes: string[];
  editor: Editor;
  filesList: FileList;
  maxFileSize: number;
  onInvalidFile: (error: EFileError, message: string) => void;
  pos: number;
  type: Extract<TEditorCommands, "attachment" | "image">;
  uploader: (file: File) => Promise<void>;
};

// Upload the first file and insert the remaining ones for uploading multiple files
export const uploadFirstFileAndInsertRemaining = async (args: TMultipleFileArgs) => {
  const { acceptedMimeTypes, editor, filesList, maxFileSize, onInvalidFile, pos, type, uploader } = args;
  const filteredFiles: File[] = [];
  for (let i = 0; i < filesList.length; i += 1) {
    const file = filesList.item(i);
    if (
      file &&
      isFileValid({
        acceptedMimeTypes,
        file,
        maxFileSize,
        onError: onInvalidFile,
      })
    ) {
      filteredFiles.push(file);
    }
  }
  if (filteredFiles.length !== filesList.length) {
    console.warn("Some files were invalid and have been ignored.");
  }
  if (filteredFiles.length === 0) {
    console.error("No files found to upload.");
    return;
  }

  // Upload the first file
  const firstFile = filteredFiles[0];
  uploader(firstFile);
  // Insert the remaining files
  const remainingFiles = filteredFiles.slice(1);
  if (remainingFiles.length > 0) {
    const docSize = editor.state.doc.content.size;
    const posOfNextFileToBeInserted = Math.min(pos + 1, docSize);
    insertFilesSafely({
      editor,
      files: remainingFiles,
      initialPos: posOfNextFileToBeInserted,
      event: "drop",
      type,
    });
  }
};
