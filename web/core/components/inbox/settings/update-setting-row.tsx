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
        <div className="w-full grid gap-4 grid-cols-[50%_repeat(auto-fit,minmax(0,1fr))]">
            <div className="text-base font-normal text-custom-text-200">
                {t(title)}
            </div>
            <div className="">
                <InboxSettingUpdate transport={EWorkspaceNotificationTransport.IN_APP} settings_key={settings_key} />
            </div>
            <div className="">
                <InboxSettingUpdate transport={EWorkspaceNotificationTransport.EMAIL} settings_key={settings_key} />
            </div>
        </div>
    );
})