import { useState } from "react";
import { observer } from "mobx-react";
import { Lock, Sparkle } from "lucide-react";
// hooks
import { useApplication } from "hooks/store";
// components
import { GptAssistantPopover } from "components/core";
import { PageInfoPopover, PageOptionsDropdown, PageSummaryPopover, PageToolbar } from "components/pages";
// ui
import { ArchiveIcon } from "@plane/ui";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";
// types
import { EditorRefApi } from "@plane/document-editor";
import { IPageStore } from "store/page.store";

type Props = {
  editorRef: EditorRefApi;
  pageStore: IPageStore;
  projectId: string;
};

export const PageEditorHeaderRoot: React.FC<Props> = observer((props) => {
  const { editorRef, pageStore, projectId } = props;
  // states
  const [gptModalOpen, setGptModal] = useState(false);
  // store hooks
  const {
    config: { envConfig },
    router: { workspaceSlug },
  } = useApplication();

  const handleAiAssistance = async (response: string) => {
    if (!workspaceSlug || !projectId) return;
    editorRef.setEditorValueAtCursorPosition(response);
  };

  return (
    <div className="flex items-center py-2 px-3 md:px-5 border-b border-custom-border-200">
      <div className="md:w-56 flex-shrink-0 lg:w-72">
        <PageSummaryPopover editorRef={editorRef} markings={[]} />
      </div>
      <PageToolbar editorRef={editorRef} />
      <div className="flex flex-grow items-center justify-end gap-3">
        {pageStore.is_locked && (
          <div className="flex items-center gap-2 h-7 rounded-full px-3 py-0.5 text-xs font-medium bg-custom-background-80 text-custom-text-300">
            <Lock className="h-3 w-3" />
            <span>Locked</span>
          </div>
        )}
        {pageStore.archived_at && (
          <div className="flex items-center gap-2 h-7 rounded-full px-3 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-500">
            <ArchiveIcon className="h-3 w-3" />
            <span>Archived at {renderFormattedDate(pageStore.archived_at)}</span>
          </div>
        )}
        {envConfig?.has_openai_configured && (
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
        <PageOptionsDropdown pageStore={pageStore} />
      </div>
    </div>
  );
});
