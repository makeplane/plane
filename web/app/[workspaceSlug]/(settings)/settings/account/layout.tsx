"use client";

import { ReactNode } from "react";
// components
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { SettingsContentWrapper, SettingsMobileNav } from "@/components/settings";
import { getProfileActivePath } from "@/components/settings/helper";
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
        <SettingsContentWrapper>{children}</SettingsContentWrapper>
      </div>
    </>
  );
});

export default ProfileSettingsLayout;
