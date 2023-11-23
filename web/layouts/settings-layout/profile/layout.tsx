import { FC, ReactNode } from "react";
// layout
import { UserAuthWrapper } from "layouts/auth-layout";
// components
import { ProfileLayoutSidebar, ProfileSettingsSidebar } from "layouts/settings-layout";
import { CommandPalette } from "components/command-palette";

interface IProfileSettingsLayout {
  children: ReactNode;
  header: ReactNode;
}

export const ProfileSettingsLayout: FC<IProfileSettingsLayout> = (props) => {
  const { children, header } = props;

  return (
    <>
      <CommandPalette />
      <UserAuthWrapper>
        <div className="relative flex h-screen w-full overflow-hidden">
          <ProfileLayoutSidebar />
          <main className="relative flex flex-col h-full w-full overflow-hidden bg-custom-background-100">
            {header}
            <div className="flex gap-2 h-full w-full overflow-x-hidden overflow-y-scroll">
              <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
                <ProfileSettingsSidebar />
              </div>
              {children}
            </div>
          </main>
        </div>
      </UserAuthWrapper>
    </>
  );
};
