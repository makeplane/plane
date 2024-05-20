import { useState } from "react";
import { observer } from "mobx-react";
import { Lock, RefreshCw, Sparkle } from "lucide-react";
// editor
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/document-editor";
// ui
import { ArchiveIcon } from "@plane/ui";
// components
import { GptAssistantPopover } from "@/components/core";
import { PageInfoPopover, PageOptionsDropdown } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useInstance } from "@/hooks/store";
// store
import { IPageStore } from "@/store/pages/page.store";

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  handleDuplicatePage: () => void;
  isSyncing: boolean;
  pageStore: IPageStore;
  projectId: string;
  readOnlyEditorRef: React.RefObject<EditorReadOnlyRefApi>;
};

export const PageExtraOptions: React.FC<Props> = observer((props) => {
  const { editorRef, handleDuplicatePage, isSyncing, pageStore, projectId, readOnlyEditorRef } = props;
  // states
  const [gptModalOpen, setGptModal] = useState(false);
  // store hooks
  const { config } = useInstance();
  // derived values
  const { archived_at, isContentEditable, isSubmitting, is_locked } = pageStore;

  const handleAiAssistance = async (response: string) => {
    if (!editorRef) return;
    editorRef.current?.setEditorValueAtCursorPosition(response);
  };

  return (
    <div className="flex flex-grow items-center justify-end gap-3">
      {isContentEditable && (
        <div
          className={cn("fade-in flex items-center gap-x-2 transition-all duration-300", {
            "fade-out": isSubmitting === "saved",
          })}
        >
          {isSubmitting === "submitting" && <RefreshCw className="h-4 w-4 stroke-custom-text-300" />}
          <span className="text-sm text-custom-text-300">{isSubmitting === "submitting" ? "Saving..." : "Saved"}</span>
        </div>
      )}
      {isSyncing && (
        <div className="flex items-center gap-x-2">
          <RefreshCw className="h-4 w-4 stroke-custom-text-300" />
          <span className="text-sm text-custom-text-300">Syncing...</span>
        </div>
      )}
      {is_locked && (
        <div className="flex h-7 items-center gap-2 rounded-full bg-custom-background-80 px-3 py-0.5 text-xs font-medium text-custom-text-300">
          <Lock className="h-3 w-3" />
          <span>Locked</span>
        </div>
      )}
      {archived_at && (
        <div className="flex h-7 items-center gap-2 rounded-full bg-blue-500/20 px-3 py-0.5 text-xs font-medium text-blue-500">
          <ArchiveIcon className="h-3 w-3" />
          <span>Archived at {renderFormattedDate(archived_at)}</span>
        </div>
      )}
      {isContentEditable && config?.has_openai_configured && (
        <GptAssistantPopover
          isOpen={gptModalOpen}
          projectId={projectId}
          handleClose={() => {
            setGptModal((prevData) => !prevData);
            // this is done so that the title do not reset after gpt popover closed
            // reset(getValues());
          }}
          onResponse={handleAiAssistance}
          placement="top-end"
          button={
            <button
              type="button"
              className="flex items-center gap-1 rounded px-1.5 py-1 text-xs hover:bg-custom-background-90"
              onClick={() => setGptModal((prevData) => !prevData)}
            >
              <Sparkle className="h-4 w-4" />
              AI
            </button>
          }
          className="!min-w-[38rem]"
        />
      )}
      <PageInfoPopover pageStore={pageStore} />
      <PageOptionsDropdown
        editorRef={isContentEditable ? editorRef.current : readOnlyEditorRef.current}
        handleDuplicatePage={handleDuplicatePage}
        pageStore={pageStore}
      />
    </div>
  );
});
