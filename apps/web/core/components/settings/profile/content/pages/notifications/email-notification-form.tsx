import { useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IUserEmailNotificationSettings } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
// components
import { SettingsControlItem } from "@/components/settings/control-item";
// services
import { UserService } from "@/services/user.service";

type Props = {
  data: IUserEmailNotificationSettings;
};

// services
const userService = new UserService();

export const NotificationsProfileSettingsForm = observer(function NotificationsProfileSettingsForm(props: Props) {
  const { data } = props;
  // translation
  const { t } = useTranslation();
  // form data
  const { control, reset } = useForm<IUserEmailNotificationSettings>({
    defaultValues: {
      ...data,
    },
  });

  const handleSettingChange = async (key: keyof IUserEmailNotificationSettings, value: boolean) => {
    try {
      await userService.updateCurrentUserEmailNotificationSettings({
        [key]: value,
      });
      setToast({
        title: t("success"),
        type: TOAST_TYPE.SUCCESS,
        message: t("email_notification_setting_updated_successfully"),
      });
    } catch (_error) {
      setToast({
        title: t("error"),
        type: TOAST_TYPE.ERROR,
        message: t("failed_to_update_email_notification_setting"),
      });
    }
  };

  useEffect(() => {
    reset(data);
  }, [reset, data]);

  return (
    <div className="flex flex-col gap-y-1">
      <SettingsControlItem
        title={t("property_changes")}
        description={t("property_changes_description")}
        control={
          <Controller
            control={control}
            name="property_change"
            render={({ field: { value, onChange } }) => (
              <ToggleSwitch
                value={value}
                onChange={(newValue) => {
                  onChange(newValue);
                  handleSettingChange("property_change", newValue);
                }}
                size="sm"
              />
            )}
          />
        }
      />
      <SettingsControlItem
        title={t("state_change")}
        description={t("state_change_description")}
        control={
          <Controller
            control={control}
            name="state_change"
            render={({ field: { value, onChange } }) => (
              <ToggleSwitch
                value={value}
                onChange={(newValue) => {
                  onChange(newValue);
                  handleSettingChange("state_change", newValue);
                }}
                size="sm"
              />
            )}
          />
        }
      />
      <div className="border-l-3 border-subtle-1 pl-3">
        <SettingsControlItem
          title={t("issue_completed")}
          description={t("issue_completed_description")}
          control={
            <Controller
              control={control}
              name="issue_completed"
              render={({ field: { value, onChange } }) => (
                <ToggleSwitch
                  value={value}
                  onChange={(newValue) => {
                    onChange(newValue);
                    handleSettingChange("issue_completed", newValue);
                  }}
                  size="sm"
                />
              )}
            />
          }
        />
      </div>
      <SettingsControlItem
        title={t("comments")}
        description={t("comments_description")}
        control={
          <Controller
            control={control}
            name="comment"
            render={({ field: { value, onChange } }) => (
              <ToggleSwitch
                value={value}
                onChange={(newValue) => {
                  onChange(newValue);
                  handleSettingChange("comment", newValue);
                }}
                size="sm"
              />
            )}
          />
        }
      />
      <SettingsControlItem
        title={t("mentions")}
        description={t("mentions_description")}
        control={
          <Controller
            control={control}
            name="mention"
            render={({ field: { value, onChange } }) => (
              <ToggleSwitch
                value={value}
                onChange={(newValue) => {
                  onChange(newValue);
                  handleSettingChange("mention", newValue);
                }}
                size="sm"
              />
            )}
          />
        }
      />
    </div>
  );
});
