import React, { useState } from "react";

// mobx
import { observer } from "mobx-react-lite";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
// headless ui
import { Menu, Transition } from "@headlessui/react";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { LiteReadOnlyEditorWithRef, LiteTextEditorWithRef } from "@plane/lite-text-editor";

import { CommentReactions } from "components/issues/peek-overview";
// icons
import { ChatBubbleLeftEllipsisIcon, CheckIcon, XMarkIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
// helpers
import { timeAgo } from "helpers/date-time.helper";
// types
import { Comment } from "types/issue";
import fileService from "services/file.service";
// services

type Props = {
  workspaceSlug: string;
  comment: Comment;
};

export const CommentCard: React.FC<Props> = observer((props) => {
  const { comment, workspaceSlug } = props;
  // store
  const { user: userStore, issueDetails: issueDetailStore } = useMobxStore();
  // states
  const [isEditing, setIsEditing] = useState(false);

  const editorRef = React.useRef<any>(null);

  const showEditorRef = React.useRef<any>(null);
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<any>({
    defaultValues: { comment_html: comment.comment_html },
  });

  const handleDelete = () => {
    if (!workspaceSlug || !issueDetailStore.peekId) return;
    issueDetailStore.deleteIssueComment(workspaceSlug, comment.project, issueDetailStore.peekId, comment.id);
  };

  const handleCommentUpdate = async (formData: Comment) => {
    if (!workspaceSlug || !issueDetailStore.peekId) return;
    issueDetailStore.updateIssueComment(workspaceSlug, comment.project, issueDetailStore.peekId, comment.id, formData);
    setIsEditing(false);

    editorRef.current?.setEditorValue(formData.comment_html);
    showEditorRef.current?.setEditorValue(formData.comment_html);
  };

  return (
    <div className="relative flex items-start space-x-3">
      <div className="relative px-1">
        {comment.actor_detail.avatar && comment.actor_detail.avatar !== "" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={comment.actor_detail.avatar}
            alt={
              comment.actor_detail.is_bot ? comment.actor_detail.first_name + " Bot" : comment.actor_detail.display_name
            }
            height={30}
            width={30}
            className="grid h-7 w-7 place-items-center rounded-full border-2 border-custom-border-200"
          />
        ) : (
          <div className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-500 text-white`}>
            {comment.actor_detail.is_bot
              ? comment?.actor_detail?.first_name?.charAt(0)
              : comment?.actor_detail?.display_name?.charAt(0)}
          </div>
        )}

        <span className="absolute -bottom-0.5 -right-1 rounded-tl bg-custom-background-80 px-0.5 py-px">
          <ChatBubbleLeftEllipsisIcon className="h-3.5 w-3.5 text-custom-text-200" aria-hidden="true" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div>
          <div className="text-xs">
            {comment.actor_detail.is_bot ? comment.actor_detail.first_name + " Bot" : comment.actor_detail.display_name}
          </div>
          <p className="mt-0.5 text-xs text-custom-text-200">
            <>commented {timeAgo(comment.created_at)}</>
          </p>
        </div>
        <div className="issue-comments-section p-0">
          <form
            onSubmit={handleSubmit(handleCommentUpdate)}
            className={`flex-col gap-2 ${isEditing ? "flex" : "hidden"}`}
          >
            <div>
              <Controller
                control={control}
                name="comment_html"
                render={({ field: { onChange, value } }) => (
                  <LiteTextEditorWithRef
                    onEnterKeyPress={handleSubmit(handleCommentUpdate)}
                    uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
                    deleteFile={fileService.deleteImage}
                    ref={editorRef}
                    value={value}
                    debouncedUpdatesEnabled={false}
                    customClassName="min-h-[50px] p-3 shadow-sm"
                    onChange={(comment_json: Object, comment_html: string) => {
                      onChange(comment_html);
                    }}
                  />
                )}
              />
            </div>
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
            <LiteReadOnlyEditorWithRef
              ref={showEditorRef}
              value={comment.comment_html}
              customClassName="text-xs border border-custom-border-200 bg-custom-background-100"
            />
            <CommentReactions commentId={comment.id} projectId={comment.project} />
          </div>
        </div>
      </div>

      {userStore?.currentUser?.id === comment?.actor_detail?.id && (
        <Menu as="div" className="relative w-min text-left">
          <Menu.Button
            type="button"
            onClick={() => { }}
            className="relative grid place-items-center rounded p-1 text-custom-text-200 hover:text-custom-text-100 outline-none cursor-pointer hover:bg-custom-background-80"
          >
            <EllipsisVerticalIcon className="h-5 w-5 text-custom-text-200 duration-300" />
          </Menu.Button>

          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute z-10 overflow-y-scroll whitespace-nowrap rounded-md max-h-36 border right-0 origin-top-right mt-1 overflow-auto min-w-[8rem] border-custom-border-300 p-1 text-xs shadow-lg focus:outline-none bg-custom-background-90">
              <Menu.Item>
                {({ active }) => (
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                      }}
                      className={`w-full select-none truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80 ${active ? "bg-custom-background-80" : ""
                        }`}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className={`w-full select-none truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80 ${active ? "bg-custom-background-80" : ""
                        }`}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      )}
    </div>
  );
});
