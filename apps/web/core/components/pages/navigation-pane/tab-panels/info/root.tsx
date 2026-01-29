import { observer } from "mobx-react";
// components
import type { TPageRootHandlers } from "@/components/pages/editor/page-root";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageNavigationPaneInfoTabActorsInfo } from "./actors-info";
import { PageNavigationPaneInfoTabDocumentInfo } from "./document-info";
import { PageNavigationPaneInfoTabVersionHistory } from "./version-history";

type Props = {
  page: TPageInstance;
  versionHistory: Pick<TPageRootHandlers, "fetchAllVersions" | "fetchVersionDetails">;
};

export const PageNavigationPaneInfoTabPanel = observer(function PageNavigationPaneInfoTabPanel(props: Props) {
  const { page, versionHistory } = props;
  return (
    <div className="flex flex-col h-full px-4">
      <div className="flex-1 overflow-y-auto mt-5">
        <PageNavigationPaneInfoTabDocumentInfo page={page} />
        <PageNavigationPaneInfoTabActorsInfo page={page} />
        <div className="flex-shrink-0 h-px bg-layer-1 my-3" />
        <PageNavigationPaneInfoTabVersionHistory page={page} versionHistory={versionHistory} />
      </div>
    </div>
  );
});
