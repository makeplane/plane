/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Breadcrumbs, Header } from "@plane/ui";
import { Button } from "@plane/propel/button";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { CreateSupportTicketModal } from "@/components/support-tickets/create-ticket-modal";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";

export const SupportTicketsHeader = observer(function SupportTicketsHeader() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { currentProjectDetails, loader } = useProject();

  return (
    <>
      {workspaceSlug && projectId && (
        <CreateSupportTicketModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
        />
      )}
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
          <Button variant="primary" size="lg" onClick={() => setIsCreateModalOpen(true)}>
            <span className="block sm:hidden">Add</span>
            <span className="hidden sm:block">New Ticket</span>
          </Button>
        </Header.RightItem>
      </Header>
    </>
  );
});
