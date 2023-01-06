// react
import React, { useEffect, useState } from "react";
// next
import Image from "next/image";
// react-hook-form
import { useForm } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// headless ui
import { Menu } from "@headlessui/react";
// ui
import { CustomMenu, TextArea } from "ui";
// icons
import { CheckIcon, EllipsisHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
// types
import type { IIssueComment } from "types";
// common
import { timeAgo } from "constants/common";

type Props = {
  comment: IIssueComment;
  onSubmit: (comment: IIssueComment) => void;
  handleCommentDeletion: (comment: string) => void;
};

const CommentCard: React.FC<Props> = ({ comment, onSubmit, handleCommentDeletion }) => {
  const { user } = useUser();

  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    formState: { isSubmitting },
    handleSubmit,
    setFocus,
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
    <div key={comment.id}>
      <div className="flex h-full w-full justify-between">
        <div className="flex w-full gap-x-4">
          <div className="flex-shrink-0">
            {comment.actor_detail.avatar && comment.actor_detail.avatar !== "" ? (
              <Image
                src={comment.actor_detail.avatar}
                alt={comment.actor_detail.name}
                height={30}
                width={30}
                className="rounded"
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
                  <TextArea
                    id="comment"
                    name="comment"
                    register={register}
                    validations={{
                      required: true,
                    }}
                    autoComplete="off"
                    mode="transparent"
                    className="w-full"
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
                  {comment.comment.split("\n").map((item, index) => (
                    <p key={index} className="text-sm">
                      {item}
                    </p>
                  ))}
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
    </div>
  );
};

export default CommentCard;
