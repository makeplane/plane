"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// helpers
import { cn } from "@/helpers/common.helper";
import { UpgradeEmptyStateButton } from "../workspace";

export const ProjectUpdatesUpgrade: FC = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="pr-10">
      <div
        className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
          "bg-gradient-to-l from-[#3b5ec6] to-[#f5f7fe]": !resolvedTheme?.includes("dark"),
        })}
      >
        <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
          <div className="flex flex-col w-full xl:max-w-[360px] gap-y-4">
            <div className="text-xl font-semibold">Track all your projects from one screen.</div>
            <div className="font-medium text-custom-text-300">
              Group Projects like you group work items by state, priority, or any other—and track their progress in one
              click.
            </div>
            <div className="flex mt-6 gap-4 flex-wrap">
              <UpgradeEmptyStateButton
                workspaceSlug={workspaceSlug?.toString()}
                flag={E_FEATURE_FLAGS.PROJECT_UPDATES}
              />
              <Link
                target="_blank"
                href="https://plane.so/contact"
                className={"bg-transparent underline text-sm text-custom-primary-200 my-auto font-medium"}
                onClick={() => {}}
              >
                {t("common.upgrade_cta.talk_to_sales")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
