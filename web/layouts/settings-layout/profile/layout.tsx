import { FC, ReactNode } from "react";
// layout
import { CommandPalette } from "@/components/command-palette";
import { UserAuthWrapper } from "@/layouts/auth-layout";
import { ProfileLayoutSidebar } from "@/layouts/settings-layout";
// components

interface IProfileSettingsLayout {
  children: ReactNode;
  header?: ReactNode;
}

export const ProfileSettingsLayout: FC<IProfileSettingsLayout> = (props) => {
  const { children, header } = props;

  return (
    <>
      <CommandPalette />
      <UserAuthWrapper>
        <div className="relative flex h-screen w-full overflow-hidden">
          <ProfileLayoutSidebar />
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
            {header}
            <div className="h-full w-full overflow-hidden">{children}</div>
          </main>
        </div>
      </UserAuthWrapper>
    </>
  );
};
