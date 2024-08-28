"use client";

import { observer } from "mobx-react";
// ui
import { Breadcrumbs, ContrastIcon } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// plane web components
import { HeaderContainer } from "@/components/containers";
import { UpgradeBadge } from "@/plane-web/components/workspace";

export const WorkspaceActiveCycleHeader = observer(() => (
  <HeaderContainer>
    <HeaderContainer.LeftItem>
      <Breadcrumbs>
        <Breadcrumbs.BreadcrumbItem
          type="text"
          link={
            <BreadcrumbLink
              label="Active Cycles"
              icon={<ContrastIcon className="h-4 w-4 text-custom-text-300 rotate-180" />}
            />
          }
        />
      </Breadcrumbs>
      <UpgradeBadge size="md" />
    </HeaderContainer.LeftItem>
  </HeaderContainer>
));
