import { FC, ReactNode } from "react";
// layout
import { SidebarHamburgerToggle } from "@/components/core/sidebar/sidebar-menu-hamburger-toggle";
import { PreferencesMobileHeader } from "@/components/profile/preferences/preferences-mobile-header";
import { useAppTheme } from "@/hooks/store";
import { ProfileSettingsLayout } from "@/layouts/settings-layout";
// local components
import { ProfilePreferenceSettingsSidebar } from "./sidebar";

interface IProfilePreferenceSettingsLayout {
  children: ReactNode;
  header?: ReactNode;
}

export const ProfilePreferenceSettingsLayout: FC<IProfilePreferenceSettingsLayout> = (props) => {
  const { children, header } = props;
  const { toggleSidebar } = useAppTheme();

  return (
    <ProfileSettingsLayout
      header={
        <div className="md:hidden flex flex-shrink-0 gap-4 items-center justify-start border-b border-custom-border-200 p-4">
          <SidebarHamburgerToggle onClick={toggleSidebar} />
        </div>
      }
    >
      <div className="h-full">
        <PreferencesMobileHeader />
        <div className="relative flex h-full w-full overflow-hidden">
          <ProfilePreferenceSettingsSidebar />
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
            {header}
            <div className="h-full w-full">{children}</div>
          </main>
        </div>
      </div>
    </ProfileSettingsLayout>
  );
};
