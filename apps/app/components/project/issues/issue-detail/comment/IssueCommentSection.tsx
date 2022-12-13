import React from "react";
// swr
import { mutate } from "swr";
// react hook form
import { useForm } from "react-hook-form";
// services
import issuesServices from "lib/services/issues.service";
// fetch keys
import { PROJECT_ISSUES_COMMENTS } from "constants/fetch-keys";
// components
import CommentCard from "components/project/issues/issue-detail/comment/IssueCommentCard";
// ui
import { TextArea, Button, Spinner } from "ui";
// types
import type { IIssueComment } from "types";

type Props = {
  comments?: IIssueComment[];
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

const defaultValues: Partial<IIssueComment> = {
  comment: "",
};

const IssueCommentSection: React.FC<Props> = ({ comments, issueId, projectId, workspaceSlug }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<IIssueComment>({ defaultValues });

  const onSubmit = async (formData: IIssueComment) => {
    await issuesServices
      .createIssueComment(workspaceSlug, projectId, issueId, formData)
      .then((response) => {
        console.log(response);
        mutate<IIssueComment[]>(PROJECT_ISSUES_COMMENTS(issueId), (prevData) => [
          response,
          ...(prevData ?? []),
        ]);
        reset(defaultValues);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const onCommentUpdate = async (comment: IIssueComment) => {
    await issuesServices
      .patchIssueComment(workspaceSlug, projectId, issueId, comment.id, comment)
      .then((response) => {
        console.log(response);
        mutate<IIssueComment[]>(PROJECT_ISSUES_COMMENTS(issueId), (prevData) => {
          const newData = prevData ?? [];
          const index = newData.findIndex((comment) => comment.id === response.id);
          newData[index] = response;
          return [...newData];
        });
      });
  };

  const onCommentDelete = async (commentId: string) => {
    await issuesServices
      .deleteIssueComment(workspaceSlug, projectId, issueId, commentId)
      .then((response) => {
        mutate<IIssueComment[]>(PROJECT_ISSUES_COMMENTS(issueId), (prevData) =>
          (prevData ?? []).filter((c) => c.id !== commentId)
        );
        console.log(response);
      });
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-gray-100 rounded-md">
          <div className="w-full">
            <TextArea
              id="comment"
              name="comment"
              register={register}
              validations={{
                required: true,
              }}
              mode="transparent"
              error={errors.comment}
              className="w-full pb-10 resize-none"
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
          </div>
          <div className="w-full flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding comment..." : "Add comment"}
              {/* <UploadingIcon /> */}
            </Button>
          </div>
        </div>
      </form>
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
    </div>
  );
};

export default IssueCommentSection;
