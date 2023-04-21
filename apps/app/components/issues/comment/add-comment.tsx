import React from "react";

import { useRouter } from "next/router";
import dynamic from "next/dynamic";

import { mutate } from "swr";

// react-hook-form
import { useForm, Controller } from "react-hook-form";
// services
import issuesServices from "services/issues.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Loader, SecondaryButton } from "components/ui";
// types
import type { IIssueComment } from "types";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), {
  ssr: false,
  loading: () => (
    <Loader className="mb-5">
      <Loader.Item height="12rem" width="100%" />
    </Loader>
  ),
});

const defaultValues: Partial<IIssueComment> = {
  comment_json: "",
  comment_html: "",
};

export const AddComment: React.FC = () => {
  const {
    handleSubmit,
    control,
    setValue,
    formState: { isSubmitting },
    reset,
  } = useForm<IIssueComment>({ defaultValues });

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { setToastAlert } = useToast();

  const onSubmit = async (formData: IIssueComment) => {
    if (
      !workspaceSlug ||
      !projectId ||
      !issueId ||
      isSubmitting ||
      !formData.comment_html ||
      !formData.comment_json
    )
      return;
    await issuesServices
      .createIssueComment(workspaceSlug as string, projectId as string, issueId as string, formData)
      .then(() => {
        mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
        reset(defaultValues);
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Comment could not be posted. Please try again.",
        })
      );
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="issue-comments-section">
          <Controller
            name="comment_json"
            control={control}
            render={({ field: { value } }) => (
              <RemirrorRichTextEditor
                value={value}
                onJSONChange={(jsonValue) => setValue("comment_json", jsonValue)}
                onHTMLChange={(htmlValue) => setValue("comment_html", htmlValue)}
                placeholder="Enter your comment..."
              />
            )}
          />

          <SecondaryButton type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? "Adding..." : "Comment"}
          </SecondaryButton>
        </div>
      </form>
    </div>
  );
};
