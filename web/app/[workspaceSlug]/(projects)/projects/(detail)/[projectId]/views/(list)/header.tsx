"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Layers } from "lucide-react";
// ui
import { Breadcrumbs, Button, Header } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
import { ViewListHeader } from "@/components/views";
// hooks
import { useCommandPalette, useProject } from "@/hooks/store";

export const ProjectViewsHeader = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleCreateViewModal } = useCommandPalette();
  const { currentProjectDetails, loader } = useProject();

  return (
    <>
      <Header>
        <Header.LeftItem>
          <Breadcrumbs isLoading={loader}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  label={currentProjectDetails?.name ?? "Project"}
                  icon={
                    currentProjectDetails && (
                      <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                        <Logo logo={currentProjectDetails?.logo_props} size={16} />
                      </span>
                    )
                  }
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label="Views" icon={<Layers className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </Header.LeftItem>
        <Header.RightItem>
          <ViewListHeader />
          <div>
            <Button variant="primary" size="sm" onClick={() => toggleCreateViewModal(true)}>
              Add view
            </Button>
          </div>
        </Header.RightItem>
      </Header>
    </>
  );
});
