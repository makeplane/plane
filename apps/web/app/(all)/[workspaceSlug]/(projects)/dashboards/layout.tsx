import { Outlet } from "react-router";
import { ContentWrapper } from "@/components/core/content-wrapper";

export default function WorkspaceDashboardsLayout() {
  return (
    <ContentWrapper>
      <Outlet />
    </ContentWrapper>
  );
}
