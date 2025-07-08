import { observer } from "mobx-react";
import { PanelRight } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { PageToolbar } from "@/components/pages";
// helpers
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web components
import { PageCollaboratorsList } from "@/plane-web/components/pages/header/collaborators-list";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  handleOpenNavigationPane: () => void;
  isNavigationPaneOpen: boolean;
  page: TPageInstance;
};

export const PageEditorToolbarRoot: React.FC<Props> = observer((props) => {
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
            {editorRef && <PageToolbar editorRef={editorRef} />}
            <div className="flex items-center gap-2">
              <PageCollaboratorsList page={page} />
              {!isNavigationPaneOpen && (
                <button
                  type="button"
                  className="flex-shrink-0 size-6 grid place-items-center rounded text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors"
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
                className="flex-shrink-0 size-6 grid place-items-center rounded text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors"
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
