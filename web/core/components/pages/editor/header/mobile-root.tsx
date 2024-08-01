import { observer } from "mobx-react";
import { EditorReadOnlyRefApi, EditorRefApi, IMarking } from "@plane/editor";
// components
import { PageExtraOptions, PageSummaryPopover, PageToolbar } from "@/components/pages";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
// store
import { IPage } from "@/store/pages/page";

type Props = {
  editorReady: boolean;
  editorRef: React.RefObject<EditorRefApi>;
  handleDuplicatePage: () => void;
  hasConnectionFailed: boolean;
  markings: IMarking[];
  page: IPage;
  readOnlyEditorReady: boolean;
  readOnlyEditorRef: React.RefObject<EditorReadOnlyRefApi>;
  setSidePeekVisible: (sidePeekState: boolean) => void;
  sidePeekVisible: boolean;
};

export const PageEditorMobileHeaderRoot: React.FC<Props> = observer((props) => {
  const {
    editorReady,
    editorRef,
    handleDuplicatePage,
    hasConnectionFailed,
    markings,
    page,
    readOnlyEditorReady,
    readOnlyEditorRef,
    setSidePeekVisible,
    sidePeekVisible,
  } = props;
  // derived values
  const { isContentEditable } = page;
  // page filters
  const { isFullWidth } = usePageFilters();

  if (!editorRef.current && !readOnlyEditorRef.current) return null;

  return (
    <>
      <div className="flex items-center border-b border-custom-border-200 px-2 py-1">
        <div className="flex-shrink-0">
          <PageSummaryPopover
            editorRef={isContentEditable ? editorRef.current : readOnlyEditorRef.current}
            isFullWidth={isFullWidth}
            markings={markings}
            sidePeekVisible={sidePeekVisible}
            setSidePeekVisible={setSidePeekVisible}
          />
        </div>
        <PageExtraOptions
          editorRef={editorRef}
          handleDuplicatePage={handleDuplicatePage}
          hasConnectionFailed={hasConnectionFailed}
          page={page}
          readOnlyEditorRef={readOnlyEditorRef}
        />
      </div>
      <div className="border-b border-custom-border-200 py-1 px-2">
        {(editorReady || readOnlyEditorReady) && isContentEditable && editorRef.current && (
          <PageToolbar editorRef={editorRef?.current} />
        )}
      </div>
    </>
  );
});
