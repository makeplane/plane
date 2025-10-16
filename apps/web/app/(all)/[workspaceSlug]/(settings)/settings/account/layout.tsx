"use client";

import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// components
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { getProfileActivePath } from "@/components/settings/helper";
import { SettingsMobileNav } from "@/components/settings/mobile";
// local imports
import { ProfileSidebar } from "./sidebar";

type Props = {
  children: ReactNode;
};

const ProfileSettingsLayout = observer((props: Props) => {
  const { children } = props;
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
          <SettingsContentWrapper>{children}</SettingsContentWrapper>
        </div>
      </div>
    </>
  );
});

export default ProfileSettingsLayout;
