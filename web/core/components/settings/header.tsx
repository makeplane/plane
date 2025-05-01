"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/ui/src/button";
import { cn } from "@plane/utils";
import { useUserSettings } from "@/hooks/store";
import SettingsTabs from "./tabs";
import WorkspaceLogo from "./workspace-logo";

export const SettingsHeader = observer(() => {
  // hooks
  const { data: currentUserSettings } = useUserSettings();
  const { t } = useTranslation();

  // redirect url for normal mode
  const redirectWorkspaceSlug =
    currentUserSettings?.workspace?.last_workspace_slug ||
    currentUserSettings?.workspace?.fallback_workspace_slug ||
    "";

  return (
    <div className="bg-custom-background-90 px-4 py-4 md:px-12 md:py-8">
      {/* Breadcrumb */}
      <Link
        href={`/${redirectWorkspaceSlug}`}
        className="group flex items-center gap-2 text-custom-text-300 mb-4 border border-transparent hover:bg-custom-background-100 hover:border-custom-border-200 w-fit pr-2 rounded-lg "
      >
        <button
          className={cn(
            getButtonStyling("neutral-primary", "sm"),
            "rounded-lg p-1 hover:bg-custom-background-100 hover:border-custom-border-200",
            "group-hover:bg-custom-background-100 group-hover:border-transparent"
          )}
        >
          <ChevronLeftIcon className="h-4 w-4  my-auto" />
        </button>
        <div className="text-sm my-auto font-semibold">{t("back_to_workspace")}</div>
        {/* Last workspace */}
        <div className="flex items-center gap-1">
          <WorkspaceLogo
            workspace={{
              logo_url: currentUserSettings?.workspace?.last_workspace_logo || "",
              name: currentUserSettings?.workspace?.last_workspace_name || "",
            }}
            size="sm"
            className="my-auto"
          />
          <div className="text-xs my-auto text-custom-text-100 font-semibold">
            {currentUserSettings?.workspace?.last_workspace_name}
          </div>
        </div>
      </Link>
      <div className="flex flex-col gap-2">
        {/* Description */}
        <div className="text-custom-text-100 font-semibold text-2xl">{t("settings")}</div>
        <div className="text-custom-text-300 text-base">{t("settings_description")}</div>
        {/* Actions */}
        <SettingsTabs />
      </div>
    </div>
  );
});
