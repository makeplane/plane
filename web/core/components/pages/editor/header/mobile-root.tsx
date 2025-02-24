import { observer } from "mobx-react";
import { EditorRefApi } from "@plane/editor";
// components
import { Header, EHeaderVariant } from "@plane/ui";
import { PageExtraOptions, PageSummaryPopover, PageToolbar } from "@/components/pages";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web hooks
import { EPageStoreType } from "@/plane-web/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  editorRef: EditorRefApi;
  page: TPageInstance;
  setSidePeekVisible: (sidePeekState: boolean) => void;
  sidePeekVisible: boolean;
  storeType: EPageStoreType;
};

export const PageEditorMobileHeaderRoot: React.FC<Props> = observer((props) => {
  const { editorRef, page, setSidePeekVisible, sidePeekVisible, storeType } = props;
  // derived values
  const { isContentEditable } = page;
  // page filters
  const { isFullWidth } = usePageFilters();

  return (
    <>
      <Header variant={EHeaderVariant.SECONDARY}>
        <div className="flex-shrink-0 my-auto">
          <PageSummaryPopover
            editorRef={editorRef}
            isFullWidth={isFullWidth}
            sidePeekVisible={sidePeekVisible}
            setSidePeekVisible={setSidePeekVisible}
          />
        </div>
        <PageExtraOptions editorRef={editorRef} page={page} storeType={storeType} />
      </Header>
      <Header variant={EHeaderVariant.TERNARY}>
        {isContentEditable && editorRef && <PageToolbar editorRef={editorRef} />}
      </Header>
    </>
  );
});
