import { Outlet } from "react-router";
// components
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectsAppPowerKProvider } from "@/components/power-k/projects-app-provider";

export default function SettingsLayout() {
  return (
    <>
      <ProjectsAppPowerKProvider />
      <div className="relative flex size-full overflow-hidden rounded-lg border border-subtle">
        <main className="relative flex size-full flex-col overflow-hidden">
          {/* Content */}
          <ContentWrapper className="md:flex w-full bg-surface-1">
            <div className="size-full overflow-hidden">
              <Outlet />
            </div>
          </ContentWrapper>
        </main>
      </div>
    </>
  );
}
