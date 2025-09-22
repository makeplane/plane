"use client";

import { observer } from "mobx-react";
// types
import { TPageNavigationTabs } from "@plane/types";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// components
import { TeamspacePagesListHeaderRoot } from "./header/index";
import { TeamspacePagesListRoot } from "./list/index";

const storeType = EPageStoreType.TEAMSPACE;

type TPageView = {
  pageType: TPageNavigationTabs;
  teamspaceId: string;
  workspaceSlug: string;
};

export const TeamspacePagesListView: React.FC<TPageView> = observer((props) => {
  const { pageType, workspaceSlug, teamspaceId } = props;
  // store hooks
  const { isAnyPageAvailable } = usePageStore(storeType);

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      {/* filters/search header */}
      {isAnyPageAvailable && (
        <TeamspacePagesListHeaderRoot pageType={pageType} teamspaceId={teamspaceId} workspaceSlug={workspaceSlug} />
      )}
      <TeamspacePagesListRoot pageType={pageType} workspaceSlug={workspaceSlug} teamspaceId={teamspaceId} />
    </div>
  );
});
