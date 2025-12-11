import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { Outlet } from "react-router";
// components
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { getProfileActivePath } from "@/components/settings/helper";
import { SettingsMobileNav } from "@/components/settings/mobile";
// local imports
import { ProfileSidebar } from "./sidebar";

function ProfileSettingsLayout() {
  // router
  const pathname = usePathname();

  return (
    <>
      <SettingsMobileNav hamburgerContent={ProfileSidebar} activePath={getProfileActivePath(pathname) || ""} />
      <div className="relative flex h-full w-full">
        <div className="hidden md:block">
          <ProfileSidebar />
        </div>
        <div className="w-full h-full overflow-y-scroll md:pt-page-y">
          <SettingsContentWrapper>
            <Outlet />
          </SettingsContentWrapper>
        </div>
      </div>
    </>
  );
}

export default observer(ProfileSettingsLayout);
