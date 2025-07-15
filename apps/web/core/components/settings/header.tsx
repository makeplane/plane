"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ChevronLeftIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/ui/src/button";
import { cn } from "@plane/utils";
import { useUserSettings, useWorkspace } from "@/hooks/store";
import { WorkspaceLogo } from "../workspace";
import SettingsTabs from "./tabs";

export const SettingsHeader = observer(() => {
  // hooks
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const { isScrolled } = useUserSettings();
  // resolved theme
  const { resolvedTheme } = useTheme();
  // redirect url for normal mode

  return (
    <div
      className={cn("bg-custom-background-90 p-page-x transition-all duration-300 ease-in-out relative", {
        "!pt-4 flex md:flex-col": isScrolled,
        "bg-custom-background-90/50": resolvedTheme === "dark",
      })}
    >
      <Link
        href={`/${currentWorkspace?.slug}`}
        className={cn(
          getButtonStyling("neutral-primary", "sm"),
          "md:absolute left-2 top-9 group flex  gap-2 text-custom-text-300 mb-4 border border-transparent w-fit rounded-lg ",
          "h-6 w-6 rounded-lg p-1 bg-custom-background-100 border-custom-border-200 ",
          isScrolled ? "-mt-2 " : "hidden p-0 overflow-hidden items-center pr-2 border-none"
        )}
      >
        <ChevronLeftIcon className={cn("h-4 w-4", !isScrolled ? "my-auto h-0" : "")} />
      </Link>
      {/* Breadcrumb */}
      <Link
        href={`/${currentWorkspace?.slug}`}
        className={cn(
          "group flex  gap-2 text-custom-text-300 mb-3 border border-transparent w-fit rounded-lg",
          !isScrolled ? "hover:bg-custom-background-100 hover:border-custom-border-200 items-center pr-2 " : " h-0 m-0"
        )}
      >
        <button
          className={cn(
            getButtonStyling("neutral-primary", "sm"),
            "h-6 w-6 rounded-lg p-1 hover:bg-custom-background-100 hover:border-custom-border-200",
            "group-hover:bg-custom-background-100 group-hover:border-transparent",
            { "h-0 hidden": isScrolled }
          )}
        >
          <ChevronLeftIcon className={cn("h-4 w-4", !isScrolled ? "my-auto" : "")} />
        </button>
        <div
          className={cn("flex gap-2 h-full w-full transition-[height] duration-300  ease-in-out", {
            "h-0 w-0 overflow-hidden": isScrolled,
          })}
        >
          <div className="text-sm my-auto font-semibold text-custom-text-200">{t("back_to_workspace")}</div>
          {/* Last workspace */}
          <div className="flex items-center gap-1">
            <WorkspaceLogo
              name={currentWorkspace?.name || ""}
              logo={currentWorkspace?.logo_url || ""}
              classNames="my-auto size-4 text-xs"
            />
            <div className="text-xs my-auto text-custom-text-100 font-semibold">{currentWorkspace?.name}</div>
          </div>
        </div>
      </Link>
      <div className="flex flex-col gap-1.5">
        {/* Description */}
        <div className="text-custom-text-100 font-semibold text-2xl">{t("settings")}</div>
        {/* Actions */}
        <SettingsTabs />
      </div>
    </div>
  );
});
