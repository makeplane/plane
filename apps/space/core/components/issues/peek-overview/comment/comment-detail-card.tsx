import React, { useRef, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { MessageSquare, MoreVertical } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { CheckIcon, CloseIcon } from "@plane/propel/icons";
import type { TIssuePublicComment } from "@plane/types";
import { getFileURL } from "@plane/utils";
// components
import { LiteTextEditor } from "@/components/editor/lite-text-editor";
import { CommentReactions } from "@/components/issues/peek-overview/comment/comment-reactions";
// helpers
import { timeAgo } from "@/helpers/date-time.helper";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useUser } from "@/hooks/store/use-user";
import useIsInIframe from "@/hooks/use-is-in-iframe";

type Props = {
  anchor: string;
  comment: TIssuePublicComment;
};

export const CommentCard = observer(function CommentCard(props: Props) {
  const { anchor, comment } = props;
  // store hooks
  const { peekId, deleteIssueComment, updateIssueComment, uploadCommentAsset } = useIssueDetails();
  const { data: currentUser } = useUser();
  const { workspace: workspaceID } = usePublish(anchor);
  const isInIframe = useIsInIframe();

  // states
  const [isEditing, setIsEditing] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const showEditorRef = useRef<EditorRefApi>(null);
  // form info
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<TIssuePublicComment>({
    defaultValues: { comment_html: comment.comment_html },
  });

  const handleDelete = () => {
    if (!anchor || !peekId) return;
    deleteIssueComment(anchor, peekId, comment.id);
  };

  const handleCommentUpdate = async (formData: TIssuePublicComment) => {
    if (!anchor || !peekId) return;
    updateIssueComment(anchor, peekId, comment.id, formData);
    setIsEditing(false);
    editorRef.current?.setEditorValue(formData.comment_html);
    showEditorRef.current?.setEditorValue(formData.comment_html);
  };

  return (
    <div className="relative flex items-start space-x-3">
      <div className="relative px-1">
        {comment.actor_detail.avatar_url && comment.actor_detail.avatar_url !== "" ? (
          <img
            src={getFileURL(comment.actor_detail.avatar_url)}
            alt={
              comment.actor_detail.is_bot ? comment.actor_detail.first_name + " Bot" : comment.actor_detail.display_name
            }
            height={30}
            width={30}
            className="grid size-7 place-items-center rounded-full border-2 border-strong-1"
          />
        ) : (
          <div
            className={`grid size-7 place-items-center rounded-full border-2 border-strong-1 bg-gray-500 text-on-color`}
          >
            {comment.actor_detail.is_bot
              ? comment?.actor_detail?.first_name?.charAt(0)
              : comment?.actor_detail?.display_name?.charAt(0)}
          </div>
        )}

        <span className="absolute -bottom-0.5 -right-1 rounded-tl-sm bg-layer-1 px-0.5 py-px">
          <MessageSquare className="size-3 text-secondary" aria-hidden="true" strokeWidth={2} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div>
          <div className="text-11">
            {comment.actor_detail.is_bot ? comment.actor_detail.first_name + " Bot" : comment.actor_detail.display_name}
          </div>
          <p className="mt-0.5 text-11 text-secondary">
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
                  <LiteTextEditor
                    editable
                    anchor={anchor}
                    workspaceId={workspaceID?.toString() ?? ""}
                    onEnterKeyPress={handleSubmit(handleCommentUpdate)}
                    ref={editorRef}
                    id={comment.id}
                    initialValue={value}
                    value={null}
                    onChange={(comment_json, comment_html) => onChange(comment_html)}
                    isSubmitting={isSubmitting}
                    showSubmitButton={false}
                    uploadFile={async (blockId, file) => {
                      const { asset_id } = await uploadCommentAsset(file, anchor, comment.id);
                      return asset_id;
                    }}
                    displayConfig={{
                      fontSize: "small-font",
                    }}
                  />
                )}
              />
            </div>
            <div className="flex gap-1 self-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group rounded-sm border border-success-strong bg-success-primary p-2 shadow-md duration-300 hover:bg-success-primary"
              >
                <CheckIcon className="h-3 w-3 text-on-color" strokeWidth={2} />
              </button>
              <button
                type="button"
                className="group rounded-sm border border-danger-strong bg-danger-primary p-2 shadow-md duration-300 hover:bg-danger-primary-hover"
                onClick={() => setIsEditing(false)}
              >
                <CloseIcon className="h-3 w-3 text-on-color" strokeWidth={2} />
              </button>
            </div>
          </form>
          <div className={`${isEditing ? "hidden" : ""}`}>
            <LiteTextEditor
              editable={false}
              anchor={anchor}
              workspaceId={workspaceID?.toString() ?? ""}
              ref={showEditorRef}
              id={comment.id}
              initialValue={comment.comment_html}
              displayConfig={{
                fontSize: "small-font",
              }}
            />
            <CommentReactions anchor={anchor} commentId={comment.id} />
          </div>
        </div>
      </div>
      {!isInIframe && currentUser?.id === comment?.actor_detail?.id && (
        <Menu as="div" className="relative w-min text-left">
          <Menu.Button
            type="button"
            onClick={() => {}}
            className="relative grid cursor-pointer place-items-center rounded-sm p-1 text-tertiary outline-none hover:bg-layer-transparent-hover"
          >
            <MoreVertical className="size-4" strokeWidth={2} />
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
            <Menu.Items className="absolute right-0 z-10 mt-1 max-h-36 min-w-[8rem] origin-top-right overflow-auto overflow-y-scroll whitespace-nowrap rounded-md border border-strong bg-surface-1 p-1 text-11 shadow-lg focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                      }}
                      className={`w-full select-none truncate rounded-sm px-1 py-1.5 text-left text-secondary hover:bg-layer-transparent-hover ${
                        active ? "bg-layer-transparent-hover" : ""
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
                      className={`w-full select-none truncate rounded-sm px-1 py-1.5 text-left text-secondary hover:bg-layer-transparent-hover ${
                        active ? "bg-layer-transparent-hover" : ""
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
