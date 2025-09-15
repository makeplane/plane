import { observer } from "mobx-react";
// plane imports
import { TPageNavigationTabs } from "@plane/types";
import { BasePagesListHeaderRoot } from "@/components/pages/header/base";
// plane web hooks
import { EPageStoreType } from "@/plane-web/hooks/store";
// local imports
import { TeamspacePageTabNavigation } from "./tab-navigation";

type Props = {
  pageType: TPageNavigationTabs;
  teamspaceId: string;
  workspaceSlug: string;
};

export const TeamspacePagesListHeaderRoot: React.FC<Props> = observer((props) => {
  const { pageType, teamspaceId, workspaceSlug } = props;

  return (
    <BasePagesListHeaderRoot
      storeType={EPageStoreType.TEAMSPACE}
      tabNavigationComponent={
        <TeamspacePageTabNavigation workspaceSlug={workspaceSlug} teamspaceId={teamspaceId} pageType={pageType} />
      }
    />
  );
});
