"use client"

import { FC } from "react";
import { observer } from "mobx-react";
import { ENotificationSettingsKey, EWorkspaceNotificationTransport } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { InboxSettingUpdate } from "./update-setting";

type InboxSettingUpdateRowProps = {
    settings_key: ENotificationSettingsKey;
    title: string;
}

export const InboxSettingUpdateRow: FC<InboxSettingUpdateRowProps> = observer((props: InboxSettingUpdateRowProps) => {
    const { title, settings_key } = props;

    const { t } = useTranslation()

    return (
        <div className="w-full flex items-center justify-between">
            <div className="text-base font-normal text-custom-text-200 w-2/4">
                {t(title)}
            </div>
            <div className="w-1/4">
                <InboxSettingUpdate transport={EWorkspaceNotificationTransport.IN_APP} settings_key={settings_key} />
            </div>
            <div className="w-1/4">
                <InboxSettingUpdate transport={EWorkspaceNotificationTransport.EMAIL} settings_key={settings_key} />
            </div>
        </div>
    );
})