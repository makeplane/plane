import { observer } from "mobx-react";
// components
import { ThemeSwitcher } from "ce/components/preferences/theme-switcher";

export const ProfileSettingsDefaultPreferencesList = observer(function ProfileSettingsDefaultPreferencesList() {
  return (
    <div className="flex flex-col gap-y-1">
      <ThemeSwitcher
        option={{
          id: "theme",
          title: "theme",
          description: "select_or_customize_your_interface_color_scheme",
        }}
      />
    </div>
  );
});
