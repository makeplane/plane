import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { Loader } from "@plane/ui";
import { PageHead } from "@/components/core/page-title";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { OrgChartService, type IOrgChartDepartment } from "@/plane-web/services/org-chart.service";
import { OrgChartEmptyState } from "./components/org-chart-empty-state";
import { OrgChartTree } from "./components/org-chart-tree";

const orgChartService = new OrgChartService();

function OrgChartPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { currentWorkspace } = useWorkspace();
  const [departments, setDepartments] = useState<IOrgChartDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Organization Chart` : undefined;

  useEffect(() => {
    if (!workspaceSlug) return;
    setIsLoading(true);
    orgChartService
      .getOrgChart(workspaceSlug)
      .then(setDepartments)
      .catch(() => setDepartments([]))
      .finally(() => setIsLoading(false));
  }, [workspaceSlug]);

  return (
    <>
      <PageHead title={pageTitle} />
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Loader>
            <Loader.Item height="40px" width="100%" />
            <Loader.Item height="40px" width="100%" />
            <Loader.Item height="40px" width="60%" />
          </Loader>
        </div>
      ) : departments.length === 0 ? (
        <OrgChartEmptyState />
      ) : (
        <OrgChartTree departments={departments} />
      )}
    </>
  );
}

export default observer(OrgChartPage);
