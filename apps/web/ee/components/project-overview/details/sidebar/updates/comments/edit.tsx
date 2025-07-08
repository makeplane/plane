import { useState } from "react";
import { Button, Input } from "@plane/ui";
import { TProjectUpdatesComment } from "@/plane-web/types";
import { TActivityOperations } from "./comment-list";

type TProps = {
  commentData: TProjectUpdatesComment;
  setIsEditing: (isEditing: boolean) => void;
  operations: TActivityOperations;
};
export const EditComment = (props: TProps) => {
  const { commentData, operations, setIsEditing } = props;
  const [newComment, setNewComment] = useState(commentData.description);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    operations.update(commentData.id, {
      description: newComment,
    });
    setIsEditing(false);
  };
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Input
        placeholder="Write your comment"
        value={newComment}
        onChange={(e) => {
          setNewComment(e.target.value);
        }}
        className="w-full shadow border-custom-border-100 mb-2"
      />
      {/* actions */}
      <div className="flex text-sm gap-2 w-fit">
        <Button type="submit" size="sm" disabled={newComment === ""}>
          Add update
        </Button>
        <Button onClick={() => setIsEditing(false)} variant="neutral-primary" size="sm">
          Cancel
        </Button>
      </div>
    </form>
  );
};
