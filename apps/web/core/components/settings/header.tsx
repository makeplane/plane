import { observer } from "mobx-react";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/propel/button";
import { cn } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserSettings } from "@/hooks/store/user";
// local imports
import { WorkspaceLogo } from "../workspace/logo";
import SettingsTabs from "./tabs";

export const SettingsHeader = observer(function SettingsHeader() {
  // hooks
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const { isScrolled } = useUserSettings();

  return (
    <div
      className={cn("bg-surface-2 p-page-x transition-all duration-300 ease-in-out relative", {
        "pt-4! flex md:flex-col": isScrolled,
      })}
    >
      <Link
        href={`/${currentWorkspace?.slug}`}
        className={cn(
          getButtonStyling("secondary", "base"),
          "md:absolute left-2 top-9 group flex  gap-2 text-tertiary mb-4 w-fit rounded-lg",
          "h-6 w-6 rounded-lg p-1",
          isScrolled ? "-mt-2 " : "hidden p-0 overflow-hidden items-center pr-2 border-none"
        )}
      >
        <ChevronLeftIcon className={cn("h-4 w-4", !isScrolled ? "my-auto h-0" : "")} />
      </Link>
      {/* Breadcrumb */}
      <Link
        href={`/${currentWorkspace?.slug}`}
        className={cn(
          "group flex  gap-2 text-tertiary mb-3 border border-transparent w-fit rounded-lg",
          !isScrolled ? "hover:bg-layer-transparent-hover hover:border-subtle items-center pr-2 " : " h-0 m-0"
        )}
      >
        <button
          className={cn(
            getButtonStyling("secondary", "base"),
            "h-6 w-6 rounded-lg p-1 hover:bg-surface-1 hover:border-subtle",
            "group-hover:bg-surface-1 group-hover:border-transparent",
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
          <div className="text-13 my-auto font-semibold text-secondary">{t("back_to_workspace")}</div>
          {/* Last workspace */}
          <div className="flex items-center gap-1">
            <WorkspaceLogo
              name={currentWorkspace?.name || ""}
              logo={currentWorkspace?.logo_url || ""}
              classNames="my-auto size-4 text-11"
            />
            <div className="text-11 my-auto text-primary font-semibold">{currentWorkspace?.name}</div>
          </div>
        </div>
      </Link>
      <div className="flex flex-col gap-1.5">
        {/* Description */}
        <div className="text-primary font-semibold text-20">{t("settings")}</div>
        {/* Actions */}
        <SettingsTabs />
      </div>
    </div>
  );
});
