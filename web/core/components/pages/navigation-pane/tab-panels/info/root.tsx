import { observer } from "mobx-react";
// components
import { TPageRootHandlers } from "@/components/pages/editor";
// store
import { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageNavigationPaneInfoTabActorsInfo } from "./actors-info";
import { PageNavigationPaneInfoTabDocumentInfo } from "./document-info";
import { PageNavigationPaneInfoTabVersionHistory } from "./version-history";

type Props = {
  page: TPageInstance;
  versionHistory: Pick<TPageRootHandlers, "fetchAllVersions" | "fetchVersionDetails">;
};

export const PageNavigationPaneInfoTabPanel: React.FC<Props> = observer((props) => {
  const { page, versionHistory } = props;

  return (
    <div className="mt-5">
      <PageNavigationPaneInfoTabDocumentInfo page={page} />
      <PageNavigationPaneInfoTabActorsInfo page={page} />
      <div className="flex-shrink-0 h-px bg-custom-background-80 my-3" />
      <PageNavigationPaneInfoTabVersionHistory page={page} versionHistory={versionHistory} />
    </div>
  );
});
