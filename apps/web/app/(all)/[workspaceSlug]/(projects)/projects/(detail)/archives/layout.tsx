"use client";

import { Outlet } from "react-router";
import type { Route } from "../+types/layout";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectsListHeader } from "@/plane-web/components/projects/header";
import { ProjectsListMobileHeader } from "@/plane-web/components/projects/mobile-header";

export default function ProjectListLayout() {
  return (
    <>
      <AppHeader header={<ProjectsListHeader />} mobileHeader={<ProjectsListMobileHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
