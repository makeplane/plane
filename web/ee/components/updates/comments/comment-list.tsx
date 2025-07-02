import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { SendHorizonal } from "lucide-react";
import { EUpdateEntityType, TUpdateComment, TUpdateOperations } from "@plane/types";
import { Input, setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
import { useUpdateDetail } from "@/plane-web/hooks/use-update-detail";
import { CommentBlock } from "./comment-block";

type TProps = {
  isCollapsed: boolean;
  updateId: string;
  workspaceSlug: string;
  entityId: string;
  entityType: EUpdateEntityType;
  handleUpdateOperations: TUpdateOperations;
};
export type TActivityOperations = {
  create: (e: React.FormEvent) => Promise<TUpdateComment | undefined>;
  update: (commentId: string, data: Partial<TUpdateComment | undefined>) => Promise<void>;
  remove: (commentId: string) => Promise<void>;
};

export const CommentList = observer((props: TProps) => {
  const { isCollapsed, updateId, workspaceSlug, entityId, entityType, handleUpdateOperations } = props;
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    comments: { getCommentsByUpdateId, getCommentById },
  } = useUpdateDetail(entityType);
  const { fetchComments, createComment } = handleUpdateOperations;

  useSWR(
    workspaceSlug && entityId && updateId ? `${entityType}_COMMENTS_${entityId}_${updateId}` : null,
    workspaceSlug && entityId && updateId ? () => fetchComments(updateId, "fetch") : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!workspaceSlug || !entityId || !updateId) throw new Error("Missing fields");
      const comment = await createComment(updateId, {
        description: newComment,
      });
      setNewComment("");
      setToast({
        title: "Success!",
        type: TOAST_TYPE.SUCCESS,
        message: "Comment created successfully.",
      });
      setIsSubmitting(false);
      return comment;
    } catch (error) {
      setToast({
        title: "Error!",
        type: TOAST_TYPE.ERROR,
        message: "Comment creation failed. Please try again later.",
      });
      setIsSubmitting(false);
    }
  };

  const comments = getCommentsByUpdateId(updateId);

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-500 ease-in-out ",
        !isCollapsed ? "max-h-[800px] border-t border-custom-border-100" : "max-h-0"
      )}
    >
      <div className="mt-4">
        <div className="max-h-[300px] overflow-scroll pb-2">
          {comments &&
            comments.map((item, id) => {
              const commentData = getCommentById(item);
              return (
                commentData && (
                  <CommentBlock
                    key={id}
                    updateId={updateId}
                    commentData={commentData}
                    workspaceSlug={workspaceSlug}
                    entityId={entityId}
                    operations={handleUpdateOperations}
                    entityType={entityType}
                  />
                )
              );
            })}
        </div>
        <form
          onSubmit={handleCreateComment}
          className="flex items-center gap-1 px-2 mb-4 w-full rounded-md shadow border border-custom-border-100"
        >
          <Input
            placeholder="Write your comment"
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
            }}
            className="px-1.5 border-none flex-grow"
          />
          <button
            type="submit"
            disabled={newComment.trim() === "" || isSubmitting}
            className={`flex items-center justify-center size-6 text-sm rounded-full flex-shrink-0 ${
              newComment.trim() === ""
                ? "bg-custom-background-80 text-custom-text-300 cursor-not-allowed"
                : "bg-custom-primary text-white hover:bg-custom-primary/90"
            }`}
          >
            <SendHorizonal className="size-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
});
