"use client";

import { Outlet } from "react-router";
import type { Route } from "../+types/layout";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { GlobalIssuesHeader } from "./header";

export default function GlobalIssuesLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, globalViewId } = params;

  return (
    <>
      <AppHeader header={<GlobalIssuesHeader workspaceSlug={workspaceSlug} globalViewId={globalViewId} />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
