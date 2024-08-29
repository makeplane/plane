import { observer } from "mobx-react";
import { EditorReadOnlyRefApi, EditorRefApi, IMarking } from "@plane/editor";
// components
import { CustomHeader } from "@plane/ui";
import { PageEditorMobileHeaderRoot, PageExtraOptions, PageSummaryPopover, PageToolbar } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
// store
import { IPage } from "@/store/pages/page";

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  readOnlyEditorRef: React.RefObject<EditorReadOnlyRefApi>;
  handleDuplicatePage: () => void;
  markings: IMarking[];
  page: IPage;
  sidePeekVisible: boolean;
  setSidePeekVisible: (sidePeekState: boolean) => void;
  editorReady: boolean;
  readOnlyEditorReady: boolean;
  handleSaveDescription: (forceSync?: boolean, initSyncVectorAsUpdate?: Uint8Array | undefined) => Promise<void>;
};

export const PageEditorHeaderRoot: React.FC<Props> = observer((props) => {
  const {
    editorRef,
    readOnlyEditorRef,
    editorReady,
    markings,
    readOnlyEditorReady,
    handleDuplicatePage,
    page,
    sidePeekVisible,
    setSidePeekVisible,
    handleSaveDescription,
  } = props;
  // derived values
  const { isContentEditable } = page;
  // page filters
  const { isFullWidth } = usePageFilters();

  if (!editorRef.current && !readOnlyEditorRef.current) return null;

  return (
    <>
      <CustomHeader variant="secondary" className="hidden md:flex justify-between">
        <div className={cn("flex-shrink-0 my-auto")}>
          <PageSummaryPopover
            editorRef={isContentEditable ? editorRef.current : readOnlyEditorRef.current}
            isFullWidth={isFullWidth}
            markings={markings}
            sidePeekVisible={sidePeekVisible}
            setSidePeekVisible={setSidePeekVisible}
          />
        </div>
        {(editorReady || readOnlyEditorReady) && isContentEditable && editorRef.current && (
          <PageToolbar editorRef={editorRef?.current} />
        )}
        <PageExtraOptions
          editorRef={editorRef}
          handleDuplicatePage={handleDuplicatePage}
          handleSaveDescription={handleSaveDescription}
          page={page}
          readOnlyEditorRef={readOnlyEditorRef}
        />
      </CustomHeader>
      <div className="md:hidden">
        <PageEditorMobileHeaderRoot
          handleSaveDescription={handleSaveDescription}
          editorRef={editorRef}
          readOnlyEditorRef={readOnlyEditorRef}
          editorReady={editorReady}
          readOnlyEditorReady={readOnlyEditorReady}
          markings={markings}
          handleDuplicatePage={handleDuplicatePage}
          page={page}
          sidePeekVisible={sidePeekVisible}
          setSidePeekVisible={setSidePeekVisible}
        />
      </div>
    </>
  );
});
