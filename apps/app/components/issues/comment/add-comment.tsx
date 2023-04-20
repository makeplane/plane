import React, { useMemo } from "react";

import { useRouter } from "next/router";
import dynamic from "next/dynamic";

import { mutate } from "swr";

// react-hook-form
import { useForm, Controller } from "react-hook-form";
// services
import issuesServices from "services/issues.service";
// ui
import { Loader, SecondaryButton } from "components/ui";
// helpers
import { debounce } from "helpers/common.helper";
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
  comment_html: "",
  comment_json: "",
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
      .catch((error) => {
        console.error(error);
      });
  };

  const updateDescription = useMemo(
    () =>
      debounce((key: any, val: any) => {
        setValue(key, val);
      }, 1000),
    [setValue]
  );

  const updateDescriptionHTML = useMemo(
    () =>
      debounce((key: any, val: any) => {
        setValue(key, val);
      }, 1000),
    [setValue]
  );

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="issue-comments-section" >
          <Controller
            name="comment_html"
            control={control}
            render={({ field: { value } }) => (
              <RemirrorRichTextEditor
                value={value}
                onBlur={(jsonValue, htmlValue) => {
                  setValue("comment_json", jsonValue);
                  setValue("comment_html", htmlValue);
                }}
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
