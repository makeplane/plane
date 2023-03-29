import React, { useEffect, useState } from "react";

import Image from "next/image";
import dynamic from "next/dynamic";

// react-hook-form
import { useForm } from "react-hook-form";
// icons
import { ChatBubbleLeftEllipsisIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
// hooks
import useUser from "hooks/use-user";
// ui
import { CustomMenu } from "components/ui";
// helpers
import { timeAgo } from "helpers/date-time.helper";
// types
import type { IIssueComment } from "types";

const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), { ssr: false });

type Props = {
  comment: IIssueComment;
  onSubmit: (comment: IIssueComment) => void;
  handleCommentDeletion: (comment: string) => void;
};

export const CommentCard: React.FC<Props> = ({ comment, onSubmit, handleCommentDeletion }) => {
  const { user } = useUser();

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
  };

  useEffect(() => {
    isEditing && setFocus("comment");
  }, [isEditing, setFocus]);

  return (
    <div className="relative flex items-start space-x-3">
      <div className="relative px-1">
        {comment.actor_detail.avatar && comment.actor_detail.avatar !== "" ? (
          <Image
            src={comment.actor_detail.avatar}
            alt={comment.actor_detail.first_name}
            height={30}
            width={30}
            className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-500 text-white"
          />
        ) : (
          <div
            className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-500 text-white`}
          >
            {comment.actor_detail.first_name.charAt(0)}
          </div>
        )}

        <span className="absolute -bottom-0.5 -right-1 rounded-tl bg-white px-0.5 py-px">
          <ChatBubbleLeftEllipsisIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div>
          <div className="text-xs">
            {comment.actor_detail.first_name}
            {comment.actor_detail.is_bot ? "Bot" : " " + comment.actor_detail.last_name}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">Commented {timeAgo(comment.created_at)}</p>
        </div>
        <div className="issue-comments-section p-0">
          {isEditing ? (
            <form className="flex flex-col gap-2" onSubmit={handleSubmit(onEnter)}>
              <RemirrorRichTextEditor
                value={comment.comment_html}
                onBlur={(jsonValue, htmlValue) => {
                  setValue("comment_json", jsonValue);
                  setValue("comment_html", htmlValue);
                }}
                placeholder="Enter Your comment..."
              />
              <div className="flex gap-1 self-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group rounded border border-green-500 bg-green-100 p-2 shadow-md duration-300 hover:bg-green-500"
                >
                  <CheckIcon className="h-3 w-3 text-green-500 duration-300 group-hover:text-white" />
                </button>
                <button
                  type="button"
                  className="group rounded border border-red-500 bg-red-100 p-2 shadow-md duration-300 hover:bg-red-500"
                  onClick={() => setIsEditing(false)}
                >
                  <XMarkIcon className="h-3 w-3 text-red-500 duration-300 group-hover:text-white" />
                </button>
              </div>
            </form>
          ) : (
            // <div
            //   className="mt-2 mb-6 text-sm text-gray-700"
            //   dangerouslySetInnerHTML={{ __html: comment.comment_html }}
            // />
            <RemirrorRichTextEditor
              value={comment.comment_html}
              editable={false}
              onBlur={() => ({})}
              noBorder
              customClassName="text-xs bg-gray-100"
            />
          )}
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
