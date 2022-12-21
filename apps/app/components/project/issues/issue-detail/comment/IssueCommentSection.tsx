import React from "react";
// router
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// react hook form
import { useForm } from "react-hook-form";
// services
import issuesServices from "lib/services/issues.service";
// fetch keys
import { PROJECT_ISSUES_COMMENTS } from "constants/fetch-keys";
// hooks
import useUser from "lib/hooks/useUser";
// components
import CommentCard from "components/project/issues/issue-detail/comment/IssueCommentCard";
// ui
import { TextArea, Button, Spinner } from "ui";
// types
import type { IIssueComment } from "types";

const defaultValues: Partial<IIssueComment> = {
  comment: "",
};

const IssueCommentSection: React.FC = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<IIssueComment>({ defaultValues });

  const router = useRouter();

  let { issueId, projectId } = router.query;

  const { activeWorkspace } = useUser();

  const { data: comments, mutate } = useSWR<IIssueComment[]>(
    activeWorkspace && projectId && issueId ? PROJECT_ISSUES_COMMENTS(issueId as string) : null,
    activeWorkspace && projectId && issueId
      ? () =>
          issuesServices.getIssueComments(
            activeWorkspace.slug,
            projectId as string,
            issueId as string
          )
      : null
  );

  const onSubmit = async (formData: IIssueComment) => {
    if (!activeWorkspace || !projectId || !issueId || isSubmitting) return;
    await issuesServices
      .createIssueComment(activeWorkspace.slug, projectId as string, issueId as string, formData)
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
    if (!activeWorkspace || !projectId || !issueId || isSubmitting) return;
    await issuesServices
      .patchIssueComment(
        activeWorkspace.slug,
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
    if (!activeWorkspace || !projectId || !issueId || isSubmitting) return;
    await issuesServices
      .deleteIssueComment(activeWorkspace.slug, projectId as string, issueId as string, commentId)
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
        <div className="w-full flex justify-center">
          <Spinner />
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-start gap-2 border rounded-md p-2">
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
          <Button type="submit" className="whitespace-nowrap" disabled={isSubmitting}>
            {isSubmitting ? "Adding comment..." : "Add comment"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default IssueCommentSection;
