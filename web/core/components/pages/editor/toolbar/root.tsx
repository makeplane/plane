import { observer } from "mobx-react";
// components
import { PageToolbar } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web components
import { PageCollaboratorsList } from "@/plane-web/components/pages/header/collaborators-list";
// plane web hooks
import { EPageStoreType } from "@/plane-web/hooks/store/use-page-store";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageEditorToolbarRoot: React.FC<Props> = observer((props) => {
  const { page } = props;
  // derived values
  const { isContentEditable, editorRef } = page;
  // page filters
  const { isFullWidth, isStickyToolbarEnabled } = usePageFilters();
  // derived values
  const shouldHideToolbar = !isStickyToolbarEnabled || !isContentEditable;

  return (
    <div
      id="page-toolbar-container"
      className={cn("max-h-[52px] transition-all ease-linear duration-300 overflow-auto", {
        "max-h-0 overflow-hidden": shouldHideToolbar,
      })}
    >
      <div
        className={cn(
          "hidden md:flex items-center relative min-h-[52px] page-toolbar-content px-page-x transition-all duration-200 ease-in-out",
          {
            "wide-layout": isFullWidth,
          }
        )}
      >
        <div className="max-w-full w-full flex items-center justify-between">
          {editorRef && <PageToolbar editorRef={editorRef} />}
          <PageCollaboratorsList page={page} />
        </div>
      </div>
    </div>
  );
});
