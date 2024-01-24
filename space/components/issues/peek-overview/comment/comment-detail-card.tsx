import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { Controller, useForm } from "react-hook-form";
import { Menu, Transition } from "@headlessui/react";
import { Check, MessageSquare, MoreVertical, X } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { LiteReadOnlyEditorWithRef, LiteTextEditorWithRef } from "@plane/lite-text-editor";

import { CommentReactions } from "components/issues/peek-overview";
// helpers
import { timeAgo } from "helpers/date-time.helper";
// types
import { Comment } from "types/issue";
// services
import fileService from "services/file.service";
import useEditorSuggestions from "hooks/use-editor-suggestions";

import { RootStore } from "store/root";
type Props = {
  workspaceSlug: string;
  comment: Comment;
};

export const CommentCard: React.FC<Props> = observer((props) => {
  const { comment, workspaceSlug } = props;
  const { project }: RootStore = useMobxStore();
  const workspaceId = project.workspace?.id;

  // store
  const { user: userStore, issueDetails: issueDetailStore } = useMobxStore();
  // states
  const [isEditing, setIsEditing] = useState(false);

  const mentionsConfig = useEditorSuggestions();

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
          <MessageSquare className="h-3 w-3 text-custom-text-200" aria-hidden="true" strokeWidth={2} />
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
                    cancelUploadImage={fileService.cancelUpload}
                    uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
                    deleteFile={fileService.getDeleteImageFunction(workspaceId as string)}
                    restoreFile={fileService.getRestoreImageFunction(workspaceId as string)}
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
                <Check className="h-3 w-3 text-green-500 duration-300 group-hover:text-white" strokeWidth={2} />
              </button>
              <button
                type="button"
                className="group rounded border border-red-500 bg-red-500/20 p-2 shadow-md duration-300 hover:bg-red-500"
                onClick={() => setIsEditing(false)}
              >
                <X className="h-3 w-3 text-red-500 duration-300 group-hover:text-white" strokeWidth={2} />
              </button>
            </div>
          </form>
          <div className={`${isEditing ? "hidden" : ""}`}>
            <LiteReadOnlyEditorWithRef
              ref={showEditorRef}
              value={comment.comment_html}
              customClassName="text-xs border border-custom-border-200 bg-custom-background-100"
              mentionHighlights={mentionsConfig.mentionHighlights}
            />
            <CommentReactions commentId={comment.id} projectId={comment.project} />
          </div>
        </div>
      </div>

      {userStore?.currentUser?.id === comment?.actor_detail?.id && (
        <Menu as="div" className="relative w-min text-left">
          <Menu.Button
            type="button"
            onClick={() => {}}
            className="relative grid cursor-pointer place-items-center rounded p-1 text-custom-text-200 outline-none hover:bg-custom-background-80 hover:text-custom-text-100"
          >
            <MoreVertical className="h-4 w-4 text-custom-text-200 duration-300" strokeWidth={2} />
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
            <Menu.Items className="absolute right-0 z-10 mt-1 max-h-36 min-w-[8rem] origin-top-right overflow-auto overflow-y-scroll whitespace-nowrap rounded-md border border-custom-border-300 bg-custom-background-90 p-1 text-xs shadow-lg focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                      }}
                      className={`w-full select-none truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80 ${
                        active ? "bg-custom-background-80" : ""
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
                      className={`w-full select-none truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80 ${
                        active ? "bg-custom-background-80" : ""
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
