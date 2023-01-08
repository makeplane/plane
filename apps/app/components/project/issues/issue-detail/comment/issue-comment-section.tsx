// react
import React, { useMemo } from "react";
// next
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

// swr
import { KeyedMutator } from "swr";
// react-hook-form
import { useForm, Controller } from "react-hook-form";
// services
import issuesServices from "lib/services/issues.service";
// components
import CommentCard from "components/project/issues/issue-detail/comment/issue-comment-card";
// ui
import { Spinner } from "ui";
// types
import type { IIssueComment } from "types";
// common
import { debounce } from "constants/common";

const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), { ssr: false });

const defaultValues: Partial<IIssueComment> = {
  comment: "",
};

const IssueCommentSection: React.FC<{
  comments: IIssueComment[];
  mutate: KeyedMutator<IIssueComment[]>;
}> = ({ comments, mutate }) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<IIssueComment>({ defaultValues });

  const router = useRouter();

  let { workspaceSlug, projectId, issueId } = router.query;

  const onSubmit = async (formData: IIssueComment) => {
    if (!workspaceSlug || !projectId || !issueId || isSubmitting) return;
    await issuesServices
      .createIssueComment(workspaceSlug as string, projectId as string, issueId as string, formData)
      .then((response) => {
        console.log(response);
        mutate((prevData) => [response, ...(prevData ?? [])]);
        reset(defaultValues);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const onCommentUpdate = async (comment: IIssueComment) => {
    if (!workspaceSlug || !projectId || !issueId || isSubmitting) return;
    await issuesServices
      .patchIssueComment(
        workspaceSlug as string,
        projectId as string,
        issueId as string,
        comment.id,
        comment
      )
      .then((response) => {
        mutate((prevData) => {
          const updatedComments = prevData?.map((c) => {
            if (c.id === comment.id) {
              return comment;
            }
            return c;
          });
          return updatedComments;
        });
      });
  };

  const onCommentDelete = async (commentId: string) => {
    if (!workspaceSlug || !projectId || !issueId || isSubmitting) return;
    await issuesServices
      .deleteIssueComment(
        workspaceSlug as string,
        projectId as string,
        issueId as string,
        commentId
      )
      .then((response) => {
        mutate((prevData) => (prevData ?? []).filter((c) => c.id !== commentId));
        console.log(response);
      });
  };

  const updateDescription = useMemo(
    () =>
      debounce((key: any, val: any) => {
        setValue(key, val);
      }, 3000),
    [setValue]
  );

  const updateDescriptionHTML = useMemo(
    () =>
      debounce((key: any, val: any) => {
        setValue(key, val);
      }, 3000),
    [setValue]
  );

  return (
    <div className="space-y-5">
      {comments ? (
        comments.length > 0 ? (
          <div className="space-y-5">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onSubmit={onCommentUpdate}
                handleCommentDeletion={onCommentDelete}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No comments yet.</p>
        )
      ) : (
        <div className="flex w-full justify-center">
          <Spinner />
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-md p-2 pt-3">
          <Controller
            name="comment_html"
            control={control}
            render={({ field: { value, onChange } }) => (
              <RemirrorRichTextEditor
                value={value}
                onChange={(val) => {
                  updateDescription("comment_json", val);
                }}
                onChangeHTML={(val) => {
                  updateDescriptionHTML("comment_html", val);
                }}
                placeholder="Enter Your comment..."
              />
            )}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-gray-300 p-2 px-4 text-sm text-black hover:bg-gray-300"
          >
            {isSubmitting ? "Adding..." : "Comment"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueCommentSection;
