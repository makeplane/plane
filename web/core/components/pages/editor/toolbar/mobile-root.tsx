import { observer } from "mobx-react";
// plane imports
import { EditorRefApi } from "@plane/editor";
import { Header, EHeaderVariant } from "@plane/ui";
// components
import { PageExtraOptions, PageToolbar } from "@/components/pages";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web hooks
import { EPageStoreType } from "@/plane-web/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  editorRef: EditorRefApi;
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageEditorMobileHeaderRoot: React.FC<Props> = observer((props) => {
  const { editorRef, page, storeType } = props;
  // derived values
  const { isContentEditable } = page;
  // page filters
  const { isStickyToolbarEnabled } = usePageFilters();

  return (
    <>
      <Header variant={EHeaderVariant.SECONDARY}>
        <PageExtraOptions editorRef={editorRef} page={page} storeType={storeType} />
      </Header>
      <Header variant={EHeaderVariant.TERNARY}>
        {isContentEditable && editorRef && <PageToolbar editorRef={editorRef} isHidden={!isStickyToolbarEnabled} />}
      </Header>
    </>
  );
});
