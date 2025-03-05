import { useRef } from "react";
import { observer } from "mobx-react";
// plane hooks
import { usePlatformOS } from "@plane/hooks";
// components
import { ListItem } from "@/components/core/list";
// plane web store
import { IWorkspaceDashboardsStore } from "@/plane-web/store/dashboards/workspace-dashboards.store";
// local components
import { WorkspaceDashboardListItemActions } from "./list-item-actions";

type Props = {
  getDashboardDetails: IWorkspaceDashboardsStore["getDashboardById"];
  id: string;
};

export const WorkspaceDashboardListItem: React.FC<Props> = observer((props) => {
  const { getDashboardDetails, id } = props;
  // refs
  const parentRef = useRef(null);
  // platform check
  const { isMobile } = usePlatformOS();
  // derived values
  const dashboardDetails = getDashboardDetails(id);

  if (!dashboardDetails) return null;

  const { getRedirectionLink } = dashboardDetails;

  return (
    <ListItem
      title={"Dashboard name"}
      itemLink={getRedirectionLink()}
      actionableItems={<WorkspaceDashboardListItemActions dashboardDetails={dashboardDetails} />}
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
