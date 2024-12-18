import { observer } from "mobx-react";
import { EditorReadOnlyRefApi, EditorRefApi, IMarking } from "@plane/editor";
// components
import { Header, EHeaderVariant } from "@plane/ui";
import { PageExtraOptions, PageSummaryPopover, PageToolbar } from "@/components/pages";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
// store
import { IPage } from "@/store/pages/page";

type Props = {
  editorReady: boolean;
  editorRef: React.RefObject<EditorRefApi>;
  handleDuplicatePage: () => void;
  page: IPage;
  setSidePeekVisible: (sidePeekState: boolean) => void;
  sidePeekVisible: boolean;
};

export const PageEditorMobileHeaderRoot: React.FC<Props> = observer((props) => {
  const { editorReady, editorRef, handleDuplicatePage, page, setSidePeekVisible, sidePeekVisible } = props;
  // derived values
  const { isContentEditable } = page;
  // page filters
  const { isFullWidth } = usePageFilters();

  if (!editorRef.current) return null;

  return (
    <>
      <Header variant={EHeaderVariant.SECONDARY}>
        <div className="flex-shrink-0 my-auto">
          <PageSummaryPopover
            editorRef={editorRef.current}
            isFullWidth={isFullWidth}
            sidePeekVisible={sidePeekVisible}
            setSidePeekVisible={setSidePeekVisible}
          />
        </div>
        <PageExtraOptions editorRef={editorRef} handleDuplicatePage={handleDuplicatePage} page={page} />
      </Header>
      <Header variant={EHeaderVariant.TERNARY}>
        {editorReady && isContentEditable && editorRef.current && <PageToolbar editorRef={editorRef?.current} />}
      </Header>
    </>
  );
});
