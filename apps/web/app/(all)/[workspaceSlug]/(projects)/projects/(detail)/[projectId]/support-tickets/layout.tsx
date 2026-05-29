import { Outlet } from "react-router";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { SupportTicketsHeader } from "./header";

export default function SupportTicketsLayout() {
  return (
    <>
      <AppHeader header={<SupportTicketsHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
