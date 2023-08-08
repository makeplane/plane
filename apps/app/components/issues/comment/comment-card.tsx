import React, { useEffect, useState } from "react";

import dynamic from "next/dynamic";

// react-hook-form
import { useForm } from "react-hook-form";
// icons
import { ChatBubbleLeftEllipsisIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
// hooks
import useUser from "hooks/use-user";
// ui
import { CustomMenu } from "components/ui";
import { CommentReaction } from "components/issues";
// helpers
import { timeAgo } from "helpers/date-time.helper";
// types
import type { IIssueComment } from "types";

const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), { ssr: false });

import { IRemirrorRichTextEditor } from "components/rich-text-editor";

const WrappedRemirrorRichTextEditor = React.forwardRef<
  IRemirrorRichTextEditor,
  IRemirrorRichTextEditor
>((props, ref) => <RemirrorRichTextEditor {...props} forwardedRef={ref} />);

WrappedRemirrorRichTextEditor.displayName = "WrappedRemirrorRichTextEditor";

type Props = {
  comment: IIssueComment;
  onSubmit: (comment: IIssueComment) => void;
  handleCommentDeletion: (comment: string) => void;
};

export const CommentCard: React.FC<Props> = ({ comment, onSubmit, handleCommentDeletion }) => {
  const { user } = useUser();

  const editorRef = React.useRef<any>(null);
  const showEditorRef = React.useRef<any>(null);

  const [isEditing, setIsEditing] = useState(false);

  const {
    formState: { isSubmitting },
    handleSubmit,
    setFocus,
    setValue,
  } = useForm<IIssueComment>({
    defaultValues: comment,
  });

  const onEnter = (formData: IIssueComment) => {
    if (isSubmitting) return;
    setIsEditing(false);

    onSubmit(formData);

    editorRef.current?.setEditorValue(formData.comment_json);
    showEditorRef.current?.setEditorValue(formData.comment_json);
  };

  useEffect(() => {
    isEditing && setFocus("comment");
  }, [isEditing, setFocus]);

  return (
    <div className="relative flex items-start space-x-3">
      <div className="relative px-1">
        {comment.actor_detail.avatar && comment.actor_detail.avatar !== "" ? (
          <img
            src={comment.actor_detail.avatar}
            alt={comment.actor_detail.display_name}
            height={30}
            width={30}
            className="grid h-7 w-7 place-items-center rounded-full border-2 border-custom-border-200"
          />
        ) : (
          <div
            className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-500 text-white`}
          >
            {comment.actor_detail.display_name.charAt(0)}
          </div>
        )}

        <span className="absolute -bottom-0.5 -right-1 rounded-tl bg-custom-background-80 px-0.5 py-px">
          <ChatBubbleLeftEllipsisIcon
            className="h-3.5 w-3.5 text-custom-text-200"
            aria-hidden="true"
          />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div>
          <div className="text-xs">
            {comment.actor_detail.is_bot
              ? comment.actor_detail.first_name + " Bot"
              : comment.actor_detail.display_name}
          </div>
          <p className="mt-0.5 text-xs text-custom-text-200">
            Commented {timeAgo(comment.created_at)}
          </p>
        </div>
        <div className="issue-comments-section p-0">
          <form
            className={`flex-col gap-2 ${isEditing ? "flex" : "hidden"}`}
            onSubmit={handleSubmit(onEnter)}
          >
            <WrappedRemirrorRichTextEditor
              value={comment.comment_html}
              onBlur={(jsonValue, htmlValue) => {
                setValue("comment_json", jsonValue);
                setValue("comment_html", htmlValue);
              }}
              placeholder="Enter Your comment..."
              ref={editorRef}
            />
            <div className="flex gap-1 self-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group rounded border border-green-500 bg-green-500/20 p-2 shadow-md duration-300 hover:bg-green-500"
              >
                <CheckIcon className="h-3 w-3 text-green-500 duration-300 group-hover:text-white" />
              </button>
              <button
                type="button"
                className="group rounded border border-red-500 bg-red-500/20 p-2 shadow-md duration-300 hover:bg-red-500"
                onClick={() => setIsEditing(false)}
              >
                <XMarkIcon className="h-3 w-3 text-red-500 duration-300 group-hover:text-white" />
              </button>
            </div>
          </form>
          <div className={`${isEditing ? "hidden" : ""}`}>
            <WrappedRemirrorRichTextEditor
              value={comment.comment_html}
              editable={false}
              noBorder
              customClassName="text-xs border border-custom-border-200 bg-custom-background-100"
              ref={showEditorRef}
            />

            <CommentReaction projectId={comment.project} commentId={comment.id} />
          </div>
        </div>
      </div>
      {user?.id === comment.actor && (
        <CustomMenu ellipsis>
          <CustomMenu.MenuItem onClick={() => setIsEditing(true)}>Edit</CustomMenu.MenuItem>
          <CustomMenu.MenuItem
            onClick={() => {
              handleCommentDeletion(comment.id);
            }}
          >
            Delete
          </CustomMenu.MenuItem>
        </CustomMenu>
      )}
    </div>
  );
};
