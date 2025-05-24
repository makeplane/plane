import { observer } from "mobx-react";
import { LayoutGrid } from "lucide-react";
// plane ui
import { Breadcrumbs, Button, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// plane web components
import { DashboardsListSearch } from "@/plane-web/components/dashboards/list/search";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";

export const WorkspaceDashboardsListHeader = observer(() => {
  // store hooks
  const {
    workspaceDashboards: { canCurrentUserCreateDashboard, toggleCreateUpdateModal, searchQuery, updateSearchQuery },
  } = useDashboards();

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label="Dashboards" icon={<LayoutGrid className="size-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <DashboardsListSearch value={searchQuery} onChange={updateSearchQuery} />
        {canCurrentUserCreateDashboard && (
          <Button variant="primary" size="sm" onClick={() => toggleCreateUpdateModal(true)}>
            Add dashboard
          </Button>
        )}
      </Header.RightItem>
    </Header>
  );
});
