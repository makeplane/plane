"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { CircleAlert, Sparkle } from "lucide-react";
// editor
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
// ui
import { ArchiveIcon, Tooltip } from "@plane/ui";
// components
import { GptAssistantPopover } from "@/components/core";
import { LockedComponent } from "@/components/icons/locked-component";
import { PageInfoPopover, PageOptionsDropdown } from "@/components/pages";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useInstance } from "@/hooks/store";
import useOnlineStatus from "@/hooks/use-online-status";
// store
import { IPage } from "@/store/pages/page";

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  handleDuplicatePage: () => void;
  hasConnectionFailed: boolean;
  page: IPage;
  readOnlyEditorRef: React.RefObject<EditorReadOnlyRefApi>;
};

export const PageExtraOptions: React.FC<Props> = observer((props) => {
  const { editorRef, handleDuplicatePage, hasConnectionFailed, page, readOnlyEditorRef } = props;
  // states
  const [gptModalOpen, setGptModal] = useState(false);
  // store hooks
  const { config } = useInstance();
  // derived values
  const { archived_at, isContentEditable, is_locked } = page;
  // use online status
  const { isOnline } = useOnlineStatus();

  const handleAiAssistance = async (response: string) => {
    if (!editorRef) return;
    editorRef.current?.setEditorValueAtCursorPosition(response);
  };

  return (
    <div className="flex flex-grow items-center justify-end gap-3">
      {is_locked && <LockedComponent />}
      {archived_at && (
        <div className="flex h-7 items-center gap-2 rounded-full bg-blue-500/20 px-3 py-0.5 text-xs font-medium text-blue-500">
          <ArchiveIcon className="flex-shrink-0 size-3" />
          <span>Archived at {renderFormattedDate(archived_at)}</span>
        </div>
      )}
      {isContentEditable && !isOnline && (
        <Tooltip
          tooltipHeading="You are offline"
          tooltipContent="All changes made will be saved locally and will be synced when the internet connection is re-established."
        >
          <div className="flex h-7 items-center gap-2 rounded-full bg-custom-background-80 px-3 py-0.5 text-xs font-medium text-custom-text-300">
            <span className="flex-shrink-0 size-1.5 rounded-full bg-custom-text-300" />
            <span>Offline</span>
          </div>
        </Tooltip>
      )}
      {hasConnectionFailed && isOnline && (
        <Tooltip
          tooltipHeading="Connection failed"
          tooltipContent="All changes made will be saved locally and will be synced when the connection is re-established."
        >
          <div className="flex h-7 items-center gap-2 rounded-full bg-red-500/20 px-3 py-0.5 text-xs font-medium text-red-500">
            <CircleAlert className="flex-shrink-0 size-3" />
            <span>Server error</span>
          </div>
        </Tooltip>
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
      <PageInfoPopover editorRef={isContentEditable ? editorRef.current : readOnlyEditorRef.current} />
      <PageOptionsDropdown
        editorRef={isContentEditable ? editorRef.current : readOnlyEditorRef.current}
        handleDuplicatePage={handleDuplicatePage}
        page={page}
      />
    </div>
  );
});
