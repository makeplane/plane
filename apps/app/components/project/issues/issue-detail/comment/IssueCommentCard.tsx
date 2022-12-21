import React, { useEffect, useState } from "react";
// next
import Image from "next/image";
// headless ui
import { Menu } from "@headlessui/react";
// react hook form
import { useForm } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// common
import { timeAgo } from "constants/common";
// ui
import { TextArea } from "ui";
// icon
import { CheckIcon, EllipsisHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
// types
import type { IIssueComment } from "types";

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
      <div className="w-full h-full flex justify-between">
        <div className="flex gap-x-2 w-full">
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
                className={`h-8 w-8 bg-gray-500 text-white border-2 border-white grid place-items-center rounded-full`}
              >
                {comment.actor_detail.first_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="w-full">
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
                  <div className="flex self-end gap-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group bg-green-100 hover:bg-green-500 border border-green-500 duration-300 p-2 rounded shadow-md"
                    >
                      <CheckIcon className="h-3 w-3 text-green-500 group-hover:text-white duration-300" />
                    </button>
                    <button
                      type="button"
                      className="group bg-red-100 hover:bg-red-500 border border-red-500 duration-300 p-2 rounded shadow-md"
                      onClick={() => setIsEditing(false)}
                    >
                      <XMarkIcon className="h-3 w-3 text-red-500 group-hover:text-white duration-300" />
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
            <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
              <span>
                {comment.actor_detail.first_name} {comment.actor_detail.last_name}
              </span>
              <span>{timeAgo(comment.created_at)}</span>
            </p>
          </div>
        </div>
        {user?.id === comment.actor && (
          <div className="relative">
            <Menu>
              <Menu.Button>
                <EllipsisHorizontalIcon className="w-5 h-5 text-gray-500" />
              </Menu.Button>
              <Menu.Items className="absolute z-20 w-28 bg-white rounded border cursor-pointer -left-24 -top-20">
                <Menu.Item>
                  <div className="hover:bg-gray-100 border-b last:border-0">
                    <button
                      className="w-full text-left py-2 pl-2"
                      type="button"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </button>
                  </div>
                </Menu.Item>
                <Menu.Item>
                  <div className="hover:bg-gray-100 border-b last:border-0">
                    <button
                      className="w-full text-left py-2 pl-2"
                      type="button"
                      onClick={() => {
                        handleCommentDeletion(comment.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentCard;
