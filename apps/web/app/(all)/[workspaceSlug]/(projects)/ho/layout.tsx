import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { HoViewTabs } from "@/plane-web/components/ho/ho-view-tabs";

export default function HoLayout() {
  return (
    <>
      <AppHeader header={<h2 className="text-h5-semibold">HO</h2>} />
      <HoViewTabs />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
