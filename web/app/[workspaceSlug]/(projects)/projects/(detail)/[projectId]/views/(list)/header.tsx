"use client";

import { observer } from "mobx-react";
import { Layers } from "lucide-react";
// ui
import { Breadcrumbs, Button, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { ViewListHeader } from "@/components/views";
// hooks
import { useCommandPalette, useProject } from "@/hooks/store";
// plane web
import { ProjectBreadcrumb } from "@/plane-web/components/breadcrumbs";

export const ProjectViewsHeader = observer(() => {
  // store hooks
  const { toggleCreateViewModal } = useCommandPalette();
  const { loader } = useProject();

  return (
    <>
      <Header>
        <Header.LeftItem>
          <Breadcrumbs isLoading={loader}>
            <ProjectBreadcrumb />
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
