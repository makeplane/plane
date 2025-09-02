"use client";

import { Home } from "lucide-react";
// plane imports
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";

export const PagesAppDashboardHeader = () => (
  <Header>
    <Header.LeftItem>
      <div>
        <Breadcrumbs>
          <Breadcrumbs.Item
            component={<BreadcrumbLink label="Home" icon={<Home className="h-4 w-4 text-custom-text-300" />} />}
          />
        </Breadcrumbs>
      </div>
    </Header.LeftItem>
  </Header>
);
