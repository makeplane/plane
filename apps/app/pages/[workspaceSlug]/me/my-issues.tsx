import React from "react";

// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// hooks
import useProjects from "hooks/use-projects";
// components
import { MyIssuesView, MyIssuesViewFilter } from "components/core";
// ui
import { PrimaryButton } from "components/ui";
import { Breadcrumbs, BreadcrumbItem } from "components/breadcrumbs";
// types
import type { NextPage } from "next";

const MyIssuesPage: NextPage = () => {
  const { projects } = useProjects();

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="My Issues" />
        </Breadcrumbs>
      }
      right={
        <div className="flex items-center gap-2">
          <MyIssuesViewFilter />
          <PrimaryButton
            className="flex items-center gap-2"
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "c" });
              document.dispatchEvent(e);
            }}
          >
            <PlusIcon className="h-4 w-4" />
            Add Issue
          </PrimaryButton>
        </div>
      }
    >
      <div className="h-full w-full flex flex-col overflow-hidden">
        <MyIssuesView />
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default MyIssuesPage;
