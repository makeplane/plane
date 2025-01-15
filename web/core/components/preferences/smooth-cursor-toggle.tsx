import { observer } from "mobx-react";
import { ToggleSwitch } from "@plane/ui";
import { useUserProfile } from "@/hooks/store";
import { PreferenceOption } from "./config";
import { PreferencesSection } from "./section";

export const SmoothCursorToggle = observer((props: { option: PreferenceOption }) => {
  const {
    data: { has_enabled_smooth_cursor },
    updateUserProfile,
  } = useUserProfile();
  return (
    <PreferencesSection
      title={props.option.title}
      description={props.option.description}
      control={
        <div className="flex items-center justify-start sm:justify-end">
          <ToggleSwitch
            value={has_enabled_smooth_cursor}
            onChange={(value) => {
              updateUserProfile({ has_enabled_smooth_cursor: value });
            }}
            label={"smooth-cursor-toggle"}
            size={"sm"}
          />
        </div>
      }
    />
  );
});
