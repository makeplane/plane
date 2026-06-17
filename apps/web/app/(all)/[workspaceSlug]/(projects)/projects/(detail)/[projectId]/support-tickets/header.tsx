"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Breadcrumbs, Header } from "@plane/ui";
import { Button } from "@plane/propel/button";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";

export const SupportTicketsHeader = observer(function SupportTicketsHeader() {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { currentProjectDetails, loader } = useProject();

  return (
    <>
      <Header>
        <Header.LeftItem>
          <Breadcrumbs onBack={router.back} isLoading={loader === "init-loader"}>
            <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Support Tickets"
                  href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/support-tickets`}
                  isLast
                />
              }
              isLast
            />
          </Breadcrumbs>
        </Header.LeftItem>
        <Header.RightItem>
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/support-tickets/create`)}
          >
            <span className="block sm:hidden">Add</span>
            <span className="hidden sm:block">New Ticket</span>
          </Button>
        </Header.RightItem>
      </Header>
    </>
  );
});
