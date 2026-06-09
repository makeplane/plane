import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useForm, Controller } from "react-hook-form";
// plane imports
import { EIssueCommentAccessSpecifier } from "@plane/constants";
import type { EditorRefApi } from "@plane/editor";
import type { TIssueComment, TCommentsOperations } from "@plane/types";
import { cn, isCommentEmpty, getTextContent } from "@plane/utils";
// ui
import { ModalCore } from "@plane/ui";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// components
import { LiteTextEditor } from "@/components/editor/lite-text";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useActiveTimers } from "@/hooks/use-active-timers";
import { useUser } from "@/hooks/store/user";
// services
import { FileService } from "@/services/file.service";
import { IssueTimerService } from "@/services/issue/issue_timer.service";

type TCommentCreate = {
  entityId: string;
  workspaceSlug: string;
  activityOperations: TCommentsOperations;
  showToolbarInitially?: boolean;
  projectId?: string;
  onSubmitCallback?: (elementId: string) => void;
};

// services
const fileService = new FileService();

export const CommentCreate = observer(function CommentCreate(props: TCommentCreate) {
  const {
    workspaceSlug,
    entityId,
    activityOperations,
    showToolbarInitially = false,
    projectId,
    onSubmitCallback,
  } = props;
  // states
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  const [isStopTimerModalOpen, setIsStopTimerModalOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<Partial<TIssueComment> | null>(null);
  const [timerNote, setTimerNote] = useState("");
  const [isStoppingTimer, setIsStoppingTimer] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const workspaceStore = useWorkspace();
  const { data: currentUser } = useUser();
  const { activeTimers } = useActiveTimers(workspaceSlug);
  const timerService = new IssueTimerService();
  // derived values
  const workspaceId = workspaceStore.getWorkspaceBySlug(workspaceSlug)?.id as string;
  // form info
  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<Partial<TIssueComment>>({
    defaultValues: {
      comment_html: "<p></p>",
    },
  });

  const handleOriginalSubmit = async (formData: Partial<TIssueComment>) => {
    try {
      const comment = await activityOperations.createComment(formData);
      if (comment?.id) onSubmitCallback?.(comment.id);
      if (uploadedAssetIds.length > 0) {
        if (projectId) {
          await fileService.updateBulkProjectAssetsUploadStatus(workspaceSlug, projectId.toString(), entityId, {
            asset_ids: uploadedAssetIds,
          });
        } else {
          await fileService.updateBulkWorkspaceAssetsUploadStatus(workspaceSlug, entityId, {
            asset_ids: uploadedAssetIds,
          });
        }
        setUploadedAssetIds([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      reset({
        comment_html: "<p></p>",
      });
      editorRef.current?.clearEditor();
    }
  };

  const onSubmit = async (formData: Partial<TIssueComment>) => {
    const myTimer = activeTimers?.find((t: any) => t.user_id === currentUser?.id && t.issue_id === entityId);
    if (myTimer) {
      setPendingFormData(formData);
      setTimerNote("");
      setIsStopTimerModalOpen(true);
    } else {
      await handleOriginalSubmit(formData);
    }
  };

  const handleStopTimerAndSave = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!pendingFormData) return;
    
    setIsStoppingTimer(true);
    try {
      if (projectId) {
        const plainText = getTextContent(pendingFormData.comment_html || "");
        await timerService.actionTimer(workspaceSlug, projectId.toString(), entityId, "stop", plainText);
      }
      
      try {
        await handleOriginalSubmit(pendingFormData);
        setPendingFormData(null);
        setTimerNote("");
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Timer stopped",
          message: "Timer stopped and note saved successfully."
        });
      } catch (submitError) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Timer stopped",
          message: "Timer was stopped, but your note failed to save to the feed. Please try saving it again."
        });
      }
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to stop timer."
      });
      setPendingFormData(null);
      setTimerNote("");
    } finally {
      setIsStoppingTimer(false);
      setIsStopTimerModalOpen(false);
    }
  };

  const handleSaveNoteOnly = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!pendingFormData) return;
    await handleOriginalSubmit(pendingFormData);
    setIsStopTimerModalOpen(false);
    setPendingFormData(null);
    setTimerNote("");
  };

  const commentHTML = watch("comment_html");
  const isEmpty = isCommentEmpty(commentHTML ?? undefined);

  return (
    <div
      className={cn("sticky bottom-0 z-[4] bg-surface-1 sm:static")}
      onKeyDown={(e) => {
        if (
          e.key === "Enter" &&
          !e.shiftKey &&
          !e.ctrlKey &&
          !e.metaKey &&
          !isEmpty &&
          !isSubmitting &&
          editorRef.current?.isEditorReadyToDiscard()
        )
          handleSubmit(onSubmit)(e);
      }}
    >
      <Controller
        name="access"
        control={control}
        render={({ field: { onChange: onAccessChange, value: accessValue } }) => (
          <Controller
            name="comment_html"
            control={control}
            render={({ field: { value, onChange } }) => (
              <LiteTextEditor
                editable
                workspaceId={workspaceId}
                id={"add_comment_" + entityId}
                value={"<p></p>"}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                onEnterKeyPress={(e) => {
                  if (!isEmpty && !isSubmitting) {
                    handleSubmit(onSubmit)(e);
                  }
                }}
                ref={editorRef}
                initialValue={value ?? "<p></p>"}
                containerClassName="min-h-min"
                onChange={(comment_json, comment_html) => onChange(comment_html)}
                accessSpecifier={accessValue ?? EIssueCommentAccessSpecifier.INTERNAL}
                handleAccessChange={onAccessChange}
                isSubmitting={isSubmitting}
                uploadFile={async (blockId, file) => {
                  const { asset_id } = await activityOperations.uploadCommentAsset(blockId, file);
                  setUploadedAssetIds((prev) => [...prev, asset_id]);
                  return asset_id;
                }}
                duplicateFile={async (assetId: string) => {
                  const { asset_id } = await activityOperations.duplicateCommentAsset(assetId);
                  setUploadedAssetIds((prev) => [...prev, asset_id]);
                  return asset_id;
                }}
                showToolbarInitially={showToolbarInitially}
                parentClassName="p-2"
                displayConfig={{
                  fontSize: "small-font",
                }}
              />
            )}
          />
        )}
      />

      {/* Stop Timer Modal — custom ModalCore without separate note input */}
      <ModalCore isOpen={isStopTimerModalOpen} handleClose={() => handleSaveNoteOnly()}>
        <div data-prevent-outside-click="true" className="w-full h-full">
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 flex-shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </span>
              <div>
                <h3 className="text-base font-medium text-custom-text-100">Stop Timer?</h3>
                <p className="mt-1 text-sm text-custom-text-300">
                  You have an active timer on this ticket. Would you like to stop the timer along with saving this note?
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-custom-border-200 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={(e) => handleSaveNoteOnly(e)}
              className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium bg-custom-background-90 border border-custom-border-200 text-custom-text-200 hover:bg-custom-background-80 transition-colors"
            >
              Save Note Only
            </button>
            <button
              type="button"
              onClick={(e) => handleStopTimerAndSave(e)}
              disabled={isStoppingTimer}
              className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-on-color bg-accent-primary hover:bg-accent-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStoppingTimer ? "Saving..." : "Stop Timer & Save Note"}
            </button>
          </div>
        </div>
      </ModalCore>
    </div>
  );
});
