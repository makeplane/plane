// react
import React, { useEffect, useState, useMemo } from "react";
// next
import Image from "next/image";
import dynamic from "next/dynamic";
// react-hook-form
import { useForm } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { CustomMenu } from "ui";
// icons
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
// types
import type { IIssueComment } from "types";
// common
import { timeAgo } from "constants/common";

const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), { ssr: false });

type Props = {
  comment: IIssueComment;
  onSubmit: (comment: IIssueComment) => void;
  handleCommentDeletion: (comment: string) => void;
};

const CommentCard: React.FC<Props> = ({ comment, onSubmit, handleCommentDeletion }) => {
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
    <div className="-ml-1 flex h-full w-full justify-between">
      <div className="flex w-full gap-x-4">
        <div className="flex-shrink-0">
          {comment.actor_detail.avatar && comment.actor_detail.avatar !== "" ? (
            <Image
              src={comment.actor_detail.avatar}
              alt={comment.actor_detail.name}
              height={30}
              width={30}
              className="rounded-full"
            />
          ) : (
            <div
              className={`grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-gray-500 text-white`}
            >
              {comment.actor_detail.first_name.charAt(0)}
            </div>
          )}
        </div>
        <div className="w-full space-y-1">
          <p className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              {comment.actor_detail.first_name} {comment.actor_detail.last_name}
            </span>
            <span>{timeAgo(comment.created_at)}</span>
          </p>
          <div>
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
              <>
                <RemirrorRichTextEditor
                  value={comment.comment_html}
                  editable={false}
                  onBlur={() => {}}
                />
              </>
            )}
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

export default CommentCard;
