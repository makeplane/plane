import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { WorkspaceStickyHeader } from "./header";

export default function WorkspaceStickiesLayout() {
  return (
    <>
      <AppHeader header={<WorkspaceStickyHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
