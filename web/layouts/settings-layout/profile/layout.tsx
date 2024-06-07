import { FC, ReactNode } from "react";
// layout
import { CommandPalette } from "@/components/command-palette";
import { ProfileLayoutSidebar } from "@/layouts/settings-layout";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
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
      <AuthenticationWrapper>
        <div className="relative flex h-screen w-full overflow-hidden">
          <ProfileLayoutSidebar />
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
            {header}
            <div className="h-full w-full overflow-hidden">{children}</div>
          </main>
        </div>
      </AuthenticationWrapper>
    </>
  );
};
