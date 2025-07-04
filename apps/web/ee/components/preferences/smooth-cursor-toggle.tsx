import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { ToggleSwitch } from "@plane/ui";
import { PreferencesSection } from "@/components/preferences/section";
import { useUserProfile } from "@/hooks/store";

export const SmoothCursorToggle = observer(
  (props: {
    option: {
      id: string;
      title: string;
      description: string;
    };
  }) => {
    const {
      data: { is_smooth_cursor_enabled },
      updateUserProfile,
    } = useUserProfile();
    const { t } = useTranslation();

    return (
      <PreferencesSection
        title={t(props.option.title)}
        description={t(props.option.description)}
        control={
          <div className="flex items-center justify-start sm:justify-end">
            <ToggleSwitch
              value={is_smooth_cursor_enabled}
              onChange={(value) => {
                updateUserProfile({ is_smooth_cursor_enabled: value });
              }}
              label={"smooth-cursor-toggle"}
              size={"sm"}
            />
          </div>
        }
      />
    );
  }
);
