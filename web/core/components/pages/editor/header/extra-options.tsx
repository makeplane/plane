"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Sparkle } from "lucide-react";
// editor
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
// ui
import { ArchiveIcon } from "@plane/ui";
// components
import { GptAssistantPopover } from "@/components/core";
import { LockedComponent } from "@/components/icons/locked-component";
import { PageInfoPopover, PageOptionsDropdown } from "@/components/pages";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useInstance } from "@/hooks/store";
// store
import { IPage } from "@/store/pages/page";

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  handleDuplicatePage: () => void;
  page: IPage;
  readOnlyEditorRef: React.RefObject<EditorReadOnlyRefApi>;
  handleSaveDescription: (forceSync?: boolean, initSyncVectorAsUpdate?: Uint8Array | undefined) => Promise<void>;
};

export const PageExtraOptions: React.FC<Props> = observer((props) => {
  const { editorRef, handleDuplicatePage, page, readOnlyEditorRef, handleSaveDescription } = props;
  // states
  const [gptModalOpen, setGptModal] = useState(false);
  // store hooks
  const { config } = useInstance();
  // derived values
  const { archived_at, isContentEditable, is_locked } = page;

  const handleAiAssistance = async (response: string) => {
    if (!editorRef) return;
    editorRef.current?.setEditorValueAtCursorPosition(response);
  };

  return (
    <div className="flex flex-grow items-center justify-end gap-3">
      {is_locked && <LockedComponent />}
      {archived_at && (
        <div className="flex h-7 items-center gap-2 rounded-full bg-blue-500/20 px-3 py-0.5 text-xs font-medium text-blue-500">
          <ArchiveIcon className="h-3 w-3" />
          <span>Archived at {renderFormattedDate(archived_at)}</span>
        </div>
      )}
      {isContentEditable && config?.has_openai_configured && (
        <GptAssistantPopover
          isOpen={gptModalOpen}
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
      <PageInfoPopover page={page} />
      <PageOptionsDropdown
        editorRef={isContentEditable ? editorRef.current : readOnlyEditorRef.current}
        handleDuplicatePage={handleDuplicatePage}
        page={page}
        handleSaveDescription={handleSaveDescription}
      />
    </div>
  );
});
