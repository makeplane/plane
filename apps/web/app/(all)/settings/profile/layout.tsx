import { Outlet } from "react-router";
// components
import { ProjectsAppPowerKProvider } from "@/components/power-k/projects-app-provider";
// lib
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";

export default function ProfileSettingsLayout() {
  return (
    <>
      <ProjectsAppPowerKProvider />
      <AuthenticationWrapper>
        <div className="relative flex size-full overflow-hidden bg-canvas p-2">
          <main className="relative flex flex-col size-full overflow-hidden bg-surface-1 rounded-lg border border-subtle">
            <div className="size-full overflow-hidden">
              <Outlet />
            </div>
          </main>
        </div>
      </AuthenticationWrapper>
    </>
  );
}
