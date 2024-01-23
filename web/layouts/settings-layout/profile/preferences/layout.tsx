import { FC, ReactNode } from "react";
// layout
import { ProfileSettingsLayout } from "layouts/settings-layout";
import { ProfilePreferenceSettingsSidebar } from "./sidebar";

interface IProfilePreferenceSettingsLayout {
  children: ReactNode;
  header?: ReactNode;
}

export const ProfilePreferenceSettingsLayout: FC<IProfilePreferenceSettingsLayout> = (props) => {
  const { children, header } = props;

  return (
    <ProfileSettingsLayout>
      <div className="relative flex h-screen w-full overflow-hidden">
        <ProfilePreferenceSettingsSidebar />
        <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
          {header}
          <div className="h-full w-full overflow-x-hidden overflow-y-scroll">{children}</div>
        </main>
      </div>
    </ProfileSettingsLayout>
  );
};
