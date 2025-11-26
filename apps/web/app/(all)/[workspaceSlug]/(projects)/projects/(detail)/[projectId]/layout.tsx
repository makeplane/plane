"use client";

import { Outlet } from "react-router";
import { Header, Row } from "@plane/ui";
import { TabNavigationRoot } from "@/components/navigation/tab-navigation-root";
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";
import type { Route } from "./+types/layout";

export default function ProjectLayout({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // preferences
  const { preferences: projectPreferences } = useProjectNavigationPreferences();

  return (
    <>
      {projectPreferences.navigationMode === "horizontal" && (
        <div className="z-20">
          <Row className="h-header flex gap-2 w-full items-center border-b border-custom-border-200 bg-custom-sidebar-background-100">
            <div className="flex items-center gap-2 divide-x divide-custom-border-100 h-full w-full">
              <div className="flex items-center h-full w-full flex-1">
                <Header className="h-full">
                  <Header.LeftItem className="h-full max-w-full">
                    <TabNavigationRoot workspaceSlug={workspaceSlug} projectId={projectId} />
                  </Header.LeftItem>
                </Header>
              </div>
            </div>
          </Row>
        </div>
      )}
      <Outlet />
    </>
  );
}
