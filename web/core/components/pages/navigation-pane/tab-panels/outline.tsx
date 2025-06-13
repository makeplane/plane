import Image from "next/image";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// store
import { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageContentBrowser } from "../../editor";

type Props = {
  page: TPageInstance;
};

export const PageNavigationPaneOutlineTabPanel: React.FC<Props> = (props) => {
  const { page } = props;
  // derived values
  const { editorRef } = page;
  // asset resolved path
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/pages/navigation-pane/outline" });
  // translation
  const { t } = useTranslation();

  const EmptyState = (
    <div className="size-full grid place-items-center">
      <div className="flex flex-col items-center gap-y-6 text-center">
        <Image src={resolvedPath} width={160} height={160} alt="An image depicting the outline of a page" />
        <div className="space-y-2.5">
          <h4 className="text-base font-medium">{t("page_navigation_pane.tabs.outline.empty_state.title")}</h4>
          <p className="text-sm text-custom-text-200 font-medium">
            {t("page_navigation_pane.tabs.outline.empty_state.description")}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="size-full pt-3 space-y-1">
      <PageContentBrowser className="mt-0" editorRef={editorRef} emptyState={EmptyState} />
    </div>
  );
};
