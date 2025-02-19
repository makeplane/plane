"use client"

import { FC } from "react";
import { observer } from "mobx-react";
import { ENotificationSettingsKey, EWorkspaceNotificationTransport } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE, ToggleSwitch } from "@plane/ui";
import { useWorkspaceNotificationSettings } from "@/hooks/store";

type InboxSettingUpdateProps = {
    settings_key: ENotificationSettingsKey;
    transport: EWorkspaceNotificationTransport;
}

export const InboxSettingUpdate: FC<InboxSettingUpdateProps> = observer((props: InboxSettingUpdateProps) => {
    const { transport, settings_key } = props;
    const { t } = useTranslation()


    const { getNotificationSettingsForTransport, updateWorkspaceUserNotificationSettings } = useWorkspaceNotificationSettings();

    const notificationSettings = getNotificationSettingsForTransport(transport);

    const handleChange = async (value: boolean) => {
        try {
            await updateWorkspaceUserNotificationSettings(transport, {
                [settings_key]: value,
            });
            setToast({
                title: t("success"),
                type: TOAST_TYPE.SUCCESS,
                message: t("notification_settings.setting_updated_successfully"),
            })
        } catch (error) {
            setToast({
                title: t("error"),
                type: TOAST_TYPE.ERROR,
                message: t("notification_settings.failed_to_update_setting"),
            })
        }
    }

    if (!notificationSettings) {
        return null;
    }

    return (
        <ToggleSwitch
            value={notificationSettings[settings_key] ?? false}
            onChange={(newValue) => {
                handleChange(newValue);
            }}
            size="md"
        />

    );
})