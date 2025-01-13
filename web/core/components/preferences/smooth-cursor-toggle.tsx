import { ToggleSwitch } from "@plane/ui";
import { PreferenceOption } from "./config";
import { PreferencesSection } from ".";

export const SmoothCursorToggle = (props: { option: PreferenceOption }) => {
  console.log("toggled");
  return (
    <PreferencesSection
      title={props.option.title}
      description={props.option.description}
      control={
        <ToggleSwitch
          value={true}
          onChange={() => {
            console.log("toggled");
          }}
          label={"smooth-cursor-toggle"}
          size={"sm"}
          className={"some"}
        />
      }
    />
  );
};
