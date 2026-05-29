// components
import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// local components
import { PagesListHeader } from "./header";

export default function ProjectPagesListLayout() {
  return (
    <>
      <AppHeader header={<PagesListHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
