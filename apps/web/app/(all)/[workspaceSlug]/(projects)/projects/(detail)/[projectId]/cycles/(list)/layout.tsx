"use client";

import { Outlet } from "react-router";
import type { Route } from "../../../+types/layout";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { CyclesListHeader } from "./header";

export default function ProjectCyclesListLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;

  return (
    <>
      <AppHeader header={<CyclesListHeader workspaceSlug={workspaceSlug} />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
