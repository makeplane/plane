import React from "react";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";

// services
import { FileService } from "services/file.service";
// components
import { LiteTextEditorWithRef } from "@plane/lite-text-editor";
// ui
import { Icon } from "components/ui";
import { Button, Tooltip } from "@plane/ui";
// types
import type { IIssueComment } from "types";

const defaultValues: Partial<IIssueComment> = {
  access: "INTERNAL",
  comment_html: "",
};

type Props = {
  disabled?: boolean;
  onSubmit: (data: IIssueComment) => Promise<void>;
  showAccessSpecifier?: boolean;
};

type commentAccessType = {
  icon: string;
  key: string;
  label: "Private" | "Public";
};
const commentAccess: commentAccessType[] = [
  {
    icon: "lock",
    key: "INTERNAL",
    label: "Private",
  },
  {
    icon: "public",
    key: "EXTERNAL",
    label: "Public",
  },
];

// services
const fileService = new FileService();

export const AddComment: React.FC<Props> = ({ disabled = false, onSubmit, showAccessSpecifier = false }) => {
  const editorRef = React.useRef<any>(null);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    reset,
  } = useForm<IIssueComment>({ defaultValues });

  const handleAddComment = async (formData: IIssueComment) => {
    if (!formData.comment_html || isSubmitting) return;

    await onSubmit(formData).then(() => {
      reset(defaultValues);
      editorRef.current?.clearEditor();
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit(handleAddComment)}>
        <div>
          <div className="relative">
            {showAccessSpecifier && (
              <div className="absolute bottom-2 left-3 z-[1]">
                <Controller
                  control={control}
                  name="access"
                  render={({ field: { onChange, value } }) => (
                    <div className="flex border border-custom-border-300 divide-x divide-custom-border-300 rounded overflow-hidden">
                      {commentAccess.map((access) => (
                        <Tooltip key={access.key} tooltipContent={access.label}>
                          <button
                            type="button"
                            onClick={() => onChange(access.key)}
                            className={`grid place-items-center p-1 hover:bg-custom-background-80 ${
                              value === access.key ? "bg-custom-background-80" : ""
                            }`}
                          >
                            <Icon
                              iconName={access.icon}
                              className={`w-4 h-4 -mt-1 ${
                                value === access.key ? "!text-custom-text-100" : "!text-custom-text-400"
                              }`}
                            />
                          </button>
                        </Tooltip>
                      ))}
                    </div>
                  )}
                />
              </div>
            )}
            <Controller
              name="access"
              control={control}
              render={({ field: { onChange: onAccessChange, value: accessValue } }) => (
                <Controller
                  name="comment_html"
                  control={control}
                  render={({ field: { onChange: onCommentChange, value: commentValue } }) => (
                    <LiteTextEditorWithRef
                      onEnterKeyPress={handleSubmit(handleAddComment)}
                      uploadFile={fileService.getUploadFileFunction(workspaceSlug as string)}
                      deleteFile={fileService.deleteImage}
                      ref={editorRef}
                      value={!commentValue || commentValue === "" ? "<p></p>" : commentValue}
                      customClassName="p-3 min-h-[100px] shadow-sm"
                      debouncedUpdatesEnabled={false}
                      onChange={(comment_json: Object, comment_html: string) => onCommentChange(comment_html)}
                      commentAccessSpecifier={{ accessValue, onAccessChange, showAccessSpecifier, commentAccess }}
                    />
                  )}
                />
              )}
            />
          </div>

          <Button variant="neutral-primary" type="submit" disabled={isSubmitting || disabled}>
            {isSubmitting ? "Adding..." : "Comment"}
          </Button>
        </div>
      </form>
    </div>
  );
};
