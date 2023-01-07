// react
import React from "react";
// next
import { useRouter } from "next/router";
// swr
import { KeyedMutator } from "swr";
// react-hook-form
import { useForm } from "react-hook-form";
// services
import issuesServices from "lib/services/issues.service";
// hooks
import useUser from "lib/hooks/useUser";
// components
import CommentCard from "components/project/issues/issue-detail/comment/issue-comment-card";
// ui
import { TextArea, Button, Spinner } from "ui";
// types
import type { IIssueComment } from "types";
// fetch-keys
import { PROJECT_ISSUES_COMMENTS } from "constants/fetch-keys";

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
          <p className="text-sm">No comments yet. Be the first to comment.</p>
        )
      ) : (
        <div className="flex w-full justify-center">
          <Spinner />
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-start gap-2 rounded-md border p-2 pt-3">
          <TextArea
            id="comment"
            name="comment"
            register={register}
            validations={{
              required: true,
            }}
            mode="transparent"
            error={errors.comment}
            placeholder="Enter your comment"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.shiftKey) {
                e.preventDefault();
                const value = e.currentTarget.value;
                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                setValue("comment", `${value.substring(0, start)}\r ${value.substring(end)}`);
              } else if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                isSubmitting || handleSubmit(onSubmit)();
              }
            }}
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
