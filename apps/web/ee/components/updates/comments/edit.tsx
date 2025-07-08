import { useState } from "react";
import { useTranslation } from "@plane/i18n";
import { TUpdateComment, TUpdateOperations } from "@plane/types";
import { Button, Input } from "@plane/ui";

type TProps = {
  commentData: TUpdateComment;
  setIsEditing: (isEditing: boolean) => void;
  operations: TUpdateOperations;
};
export const EditComment = (props: TProps) => {
  const { commentData, operations, setIsEditing } = props;
  const [newComment, setNewComment] = useState(commentData.description);
  //store hooks
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    operations.patchComment(commentData.id, {
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
      <div className="flex text-sm gap-2 w-fit capitalize">
        <Button type="submit" size="sm" disabled={newComment === ""}>
          {t("update")}
        </Button>
        <Button onClick={() => setIsEditing(false)} variant="neutral-primary" size="sm">
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
};
