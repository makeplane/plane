import { Outlet } from "react-router";
// components
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectsAppPowerKProvider } from "@/components/power-k/projects-app-provider";
import { SettingsHeader } from "@/components/settings/header";

export default function SettingsLayout() {
  return (
    <>
      <ProjectsAppPowerKProvider />
      <div className="relative flex h-full w-full overflow-hidden rounded-lg border border-subtle-1">
        <main className="relative flex h-full w-full flex-col overflow-hidden bg-surface-1">
          {/* Header */}
          <SettingsHeader />
          {/* Content */}
          <ContentWrapper className="p-page-x md:flex w-full">
            <div className="w-full h-full overflow-hidden">
              <Outlet />
            </div>
          </ContentWrapper>
        </main>
      </div>
    </>
  );
}
