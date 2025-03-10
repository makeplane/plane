import { useRef } from "react";
import { observer } from "mobx-react";
// plane hooks
import { usePlatformOS } from "@plane/hooks";
// components
import { ListItem } from "@/components/core/list";
// plane web store
import { IDashboardInstance } from "@/plane-web/store/dashboards/dashboard";
// local components
import { DashboardListItemActions } from "./list-item-actions";

type Props = {
  getDashboardDetails: (dashboardId: string) => IDashboardInstance | undefined;
  id: string;
};

export const DashboardListItem: React.FC<Props> = observer((props) => {
  const { getDashboardDetails, id } = props;
  // refs
  const parentRef = useRef(null);
  // platform check
  const { isMobile } = usePlatformOS();
  // derived values
  const dashboard = getDashboardDetails(id);

  if (!dashboard) return null;

  const { getRedirectionLink } = dashboard;

  return (
    <ListItem
      title={dashboard.name ?? ""}
      itemLink={getRedirectionLink()}
      actionableItems={<DashboardListItemActions dashboard={dashboard} parentRef={parentRef} />}
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
