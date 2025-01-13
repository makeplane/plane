import { ToggleSwitch } from "@plane/ui";
import { PreferenceOption } from "./config";
import { PreferencesSection } from ".";
import { useUserProfile } from "@/hooks/store";
import { observer } from "mobx-react";

export const SmoothCursorToggle = observer((props: { option: PreferenceOption }) => {
  const {
    data: { has_enabled_smooth_cursor },
    updateUserProfile,
  } = useUserProfile();
  console.log("has_enabled_smooth_cursor", has_enabled_smooth_cursor);
  return (
    <PreferencesSection
      title={props.option.title}
      description={props.option.description}
      control={
        <ToggleSwitch
          value={has_enabled_smooth_cursor}
          onChange={(value) => {
            console.log("toggled", value);
            updateUserProfile({ has_enabled_smooth_cursor: value });
          }}
          label={"smooth-cursor-toggle"}
          size={"sm"}
          className={"some"}
        />
      }
    />
  );
});
