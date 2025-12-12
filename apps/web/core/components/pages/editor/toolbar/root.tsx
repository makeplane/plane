import { observer } from "mobx-react";
import { PanelRight } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// components
import { PageToolbar } from "@/components/pages/editor/toolbar";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web components
import { PageCollaboratorsList } from "@/plane-web/components/pages/header/collaborators-list";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  handleOpenNavigationPane: () => void;
  isNavigationPaneOpen: boolean;
  page: TPageInstance;
};

export const PageEditorToolbarRoot = observer(function PageEditorToolbarRoot(props: Props) {
  const { handleOpenNavigationPane, isNavigationPaneOpen, page } = props;
  // translation
  const { t } = useTranslation();
  // derived values
  const {
    isContentEditable,
    editor: { editorRef },
  } = page;
  // page filters
  const { isFullWidth, isStickyToolbarEnabled } = usePageFilters();
  // derived values
  const shouldHideToolbar = !isStickyToolbarEnabled || !isContentEditable;

  return (
    <>
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
            <div className="flex-1">{editorRef && <PageToolbar editorRef={editorRef} />}</div>
            <div className="flex items-center gap-2">
              <PageCollaboratorsList page={page} />
              {!isNavigationPaneOpen && (
                <button
                  type="button"
                  className="shrink-0 size-6 grid place-items-center rounded-sm text-secondary hover:text-primary hover:bg-layer-transparent-hover transition-colors"
                  onClick={handleOpenNavigationPane}
                >
                  <PanelRight className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {shouldHideToolbar && (
        <div className="absolute z-10 top-0 right-0 h-[52px] px-page-x flex items-center">
          {!isNavigationPaneOpen && (
            <Tooltip tooltipContent={t("page_navigation_pane.open_button")}>
              <button
                type="button"
                className="shrink-0 size-6 grid place-items-center rounded-sm text-secondary hover:text-primary hover:bg-layer-transparent-hover transition-colors"
                onClick={handleOpenNavigationPane}
                aria-label={t("page_navigation_pane.open_button")}
              >
                <PanelRight className="size-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
      )}
    </>
  );
});
