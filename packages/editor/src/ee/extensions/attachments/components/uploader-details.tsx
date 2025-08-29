import { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { useMemo } from "react";
// plane imports
import { cn } from "@plane/utils";
// helpers
import { EFileError } from "@/helpers/file";
// local imports
import { getAttachmentExtensionErrorMap } from "../utils";
import { CustomAttachmentUploadStatus } from "./upload-status";

type Props = {
  blockId: string;
  editor: Editor;
  fileBeingUploaded: File | null;
  maxFileSize: number;
};

export const CustomAttachmentUploaderDetails: React.FC<Props> = (props) => {
  const { blockId, editor, fileBeingUploaded, maxFileSize } = props;
  // subscribe to editor storage
  const fileUploadErrorMap = useEditorState({
    editor,
    selector: ({ editor }) => getAttachmentExtensionErrorMap(editor),
  });
  const fileUploadError = fileUploadErrorMap?.get(blockId);

  const errorMessage = useMemo(() => {
    let title = "";
    let description: React.ReactNode = "";

    switch (fileUploadError?.error) {
      case EFileError.FILE_SIZE_TOO_LARGE:
        // title = t("attachmentComponent.errors.file_too_large.title");
        title = "File too large.";
        // description = t("attachmentComponent.errors.file_too_large.description", {
        //   maxFileSize: maxFileSize / 1024 / 1024,
        // });
        description = `Maximum size per file is ${maxFileSize / 1024 / 1024}MB`;
        break;
      case EFileError.INVALID_FILE_TYPE:
        // title = t("attachmentComponent.errors.unsupported_file_type.title");
        title = "Unsupported file type.";
        description = (
          <a
            href="https://docs.plane.so/core-concepts/issues/overview#supported-file-types"
            target="_blank"
            rel="noopener noreferrer"
            className="text-custom-primary-100 hover:underline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {/* {t("attachmentComponent.errors.unsupported_file_type.description")} */}
            See supported formats
          </a>
        );
        break;
      default:
        // title = t("attachmentComponent.errors.default.title");
        title = "Upload failed.";
        // description = t("attachmentComponent.errors.default.description");
        description = "Something went wrong. Please try again.";
    }
    return {
      title,
      description,
    };
  }, [fileUploadError, maxFileSize]);

  return (
    <div className="truncate">
      <p
        className={cn("not-prose text-sm truncate", {
          "text-red-500": !fileBeingUploaded && fileUploadError,
        })}
      >
        {fileBeingUploaded
          ? fileBeingUploaded?.name
          : fileUploadError
            ? `${fileUploadError.file.name}- ${errorMessage.title}`
            : // : t("attachmentComponent.uploader.drag_and_drop")
              "Drop files here or click to upload"}
      </p>
      <p className="not-prose text-xs text-custom-text-300">
        {fileBeingUploaded ? (
          <CustomAttachmentUploadStatus editor={editor} nodeId={blockId} />
        ) : fileUploadError ? (
          errorMessage.description
        ) : (
          // t("attachmentComponent.errors.file_too_large.description", {
          //   maxFileSize: maxFileSize / 1024 / 1024,
          // })
          `Maximum size per file is ${maxFileSize / 1024 / 1024}MB`
        )}
      </p>
    </div>
  );
};
