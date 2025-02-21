import { observer } from "mobx-react";
import { LayoutGrid } from "lucide-react";
// plane ui
import { Breadcrumbs, Button, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// plane web hooks
import { useWorkspaceDashboards } from "@/plane-web/hooks/store";

export const WorkspaceDashboardsListHeader = observer(() => {
  // store hooks
  const { toggleCreateUpdateModal } = useWorkspaceDashboards();

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
        <Button variant="primary" size="sm" onClick={() => toggleCreateUpdateModal(true)}>
          Add dashboard
        </Button>
      </Header.RightItem>
    </Header>
  );
});
