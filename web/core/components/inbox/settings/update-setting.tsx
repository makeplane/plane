"use client"

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { EWorkspaceNotificationTransport } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ToggleSwitch } from "@plane/ui";
import { useWorkspaceNotificationSettings } from "@/hooks/store";

type InboxSettingUpdateProps = {
    settings_key: string;
    title: string;
}

export const InboxSettingUpdate: FC<InboxSettingUpdateProps> = observer((props: InboxSettingUpdateProps) => {
    const { title, settings_key } = props;

    const [isChecked, setIsChecked] = useState(false);

    const { t } = useTranslation()

    const { workspace: currentWorkspace, getNotificationSettingsForTransport } = useWorkspaceNotificationSettings();


    console.log("check tracked data", getNotificationSettingsForTransport(EWorkspaceNotificationTransport.EMAIL))
    return (
        <div className="w-full flex items-center justify-between">
            <div className="text-base font-normal text-custom-text-200 w-2/4">
                {t(title)}
            </div>
            <div className="w-1/4">
                <ToggleSwitch
                    value={isChecked}
                    onChange={(newValue) => {
                        setIsChecked(newValue);
                    }}
                    size="md"
                />
            </div>
            <div className="w-1/4">
                <ToggleSwitch
                    value={isChecked}
                    onChange={(newValue) => {
                        setIsChecked(newValue);
                    }}
                    size="md"
                />
            </div>
        </div>
    );
})