import { observer } from "mobx-react";
import { EditorRefApi } from "@plane/editor";
// components
import { PageEditorMobileHeaderRoot, PageExtraOptions, PageToolbar } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web hooks
import { EPageStoreType } from "@/plane-web/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  editorReady: boolean;
  editorRef: React.RefObject<EditorRefApi>;
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageEditorToolbarRoot: React.FC<Props> = observer((props) => {
  const { editorReady, editorRef, page, storeType } = props;
  // derived values
  const { isContentEditable } = page;
  // page filters
  const { isFullWidth, isStickyToolbarEnabled } = usePageFilters();
  // derived values
  const resolvedEditorRef = editorRef.current;

  if (!resolvedEditorRef) return null;

  return (
    <div id="page-toolbar-container">
      <div
        className={cn(
          "hidden md:flex items-center relative min-h-[52px] page-toolbar-content border-b border-custom-border-200 px-page-x transition-all duration-200 ease-in-out",
          {
            "wide-layout": isFullWidth,
          }
        )}
      >
        <div className="max-w-full w-full flex items-center justify-between">
          <div>
            {isStickyToolbarEnabled && editorReady && isContentEditable && editorRef.current && (
              <PageToolbar editorRef={editorRef?.current} />
            )}
          </div>
          <PageExtraOptions editorRef={resolvedEditorRef} page={page} storeType={storeType} />
        </div>
      </div>
      <div className="md:hidden">
        <PageEditorMobileHeaderRoot editorRef={resolvedEditorRef} page={page} storeType={storeType} />
      </div>
    </div>
  );
});
