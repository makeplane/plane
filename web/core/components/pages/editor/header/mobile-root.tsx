import { observer } from "mobx-react";
import { EditorRefApi } from "@plane/editor";
// components
import { Header, EHeaderVariant } from "@plane/ui";
import { PageExtraOptions, PageToolbar } from "@/components/pages";
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

  return (
    <>
      <Header variant={EHeaderVariant.SECONDARY}>
        <PageExtraOptions editorRef={editorRef} page={page} storeType={storeType} />
      </Header>
      <Header variant={EHeaderVariant.TERNARY}>
        {isContentEditable && editorRef && <PageToolbar editorRef={editorRef} />}
      </Header>
    </>
  );
});
