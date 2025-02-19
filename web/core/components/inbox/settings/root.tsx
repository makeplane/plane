"use client";

import { FC } from "react";
import { COMMENT_NOTIFICATION_SETTINGS, TASK_UPDATES_NOTIFICATION_SETTINGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { InboxSettingUpdateRow } from "./update-setting-row";


export const InboxSettingsRoot: FC = (props) => {
  const { } = props;
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-col gap-5 pt-4 pb-10 border-b border-custom-border-100">
        <div className="text-lg font-normal text-custom-text-100">
          {t("notification_settings.task_updates")}
        </div>
        <div className="flex items-center text-sm text-custom-text-350 font-semibold">
          <div className="w-2/4">{t("notification_settings.advanced_settings")}</div>
          <div className="w-1/4">{t("notification_settings.in_plane")}</div>
          <div className="w-1/4">{t("notification_settings.email")}</div>
        </div>
        {
          TASK_UPDATES_NOTIFICATION_SETTINGS?.map((item, index) => (
            <InboxSettingUpdateRow key={item.key} settings_key={item.key} title={item.i18n_title} />
          ))
        }
      </div>
      <div className="flex flex-col gap-5 py-4">
        <div className="text-lg font-normal text-custom-text-100">
          {t("notification_settings.comments")}
        </div>
        <div className="flex items-center text-sm text-custom-text-350 font-semibold">
          <div className="w-2/4">{t("notification_settings.advanced_settings")}</div>
          <div className="w-1/4">{t("notification_settings.in_plane")}</div>
          <div className="w-1/4">{t("notification_settings.email")}</div>
        </div>
        {
          COMMENT_NOTIFICATION_SETTINGS?.map((item, index) => (
            <InboxSettingUpdateRow key={index} settings_key={item.key} title={item.i18n_title} />
          ))
        }
      </div>
    </>
  );
};