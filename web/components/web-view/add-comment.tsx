import React from "react";

// next
import { useRouter } from "next/router";

// react-hook-form
import { useForm, Controller } from "react-hook-form";

// hooks
import useProjectDetails from "hooks/use-project-details";

// components
import { TipTapEditor } from "components/tiptap";

// icons
import { Send } from "lucide-react";

// ui
import { Icon, SecondaryButton, Tooltip, PrimaryButton } from "components/ui";

// types
import type { IIssueComment } from "types";

const defaultValues: Partial<IIssueComment> = {
  access: "INTERNAL",
  comment_html: "",
};

type Props = {
  disabled?: boolean;
  onSubmit: (data: IIssueComment) => Promise<void>;
};

const commentAccess = [
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

export const AddComment: React.FC<Props> = ({ disabled = false, onSubmit }) => {
  const editorRef = React.useRef<any>(null);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { projectDetails } = useProjectDetails();

  const showAccessSpecifier = projectDetails?.is_deployed;

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
    <form className="w-full flex gap-x-2" onSubmit={handleSubmit(handleAddComment)}>
      <div className="relative flex-grow">
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
          name="comment_html"
          control={control}
          render={({ field: { value, onChange } }) => (
            <TipTapEditor
              workspaceSlug={workspaceSlug as string}
              ref={editorRef}
              value={!value || value === "" ? "<p></p>" : value}
              customClassName="p-3 min-h-[100px] shadow-sm"
              debouncedUpdatesEnabled={false}
              onChange={(comment_json: Object, comment_html: string) => onChange(comment_html)}
            />
          )}
        />
      </div>

      <div className="inline">
        <PrimaryButton
          type="submit"
          disabled={isSubmitting || disabled}
          className="mt-2 w-10 h-10 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </PrimaryButton>
      </div>
    </form>
  );
};
