import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core/page-title";
import { SupportTicketTable } from "@/components/support-tickets/ticket-table";
// hooks
import { useProject } from "@/hooks/store/use-project";
import type { Route } from "./+types/page";

function SupportTicketsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  const { getProjectById } = useProject();

  const project = getProjectById(projectId);
  const pageTitle = project?.name ? `${project?.name} - Support Tickets` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="h-full w-full">
        <SupportTicketTable workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>
    </>
  );
}

export default observer(SupportTicketsPage);
