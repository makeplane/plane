"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// assets
import WorkflowsUpgradeDark from "@/public/empty-state/workflows/upgrade-dark.webp";
import WorkflowsUpgradeLight from "@/public/empty-state/workflows/upgrade-light.webp";
import { UpgradeEmptyStateButton } from "../../workspace/upgrade-empty-state-button";

export const WorkflowUpgrade: FC = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();

  return (
    <div
      className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
        "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
        "bg-gradient-to-l from-[#EBEBEB] to-[#FAFAFA] border border-custom-border-400":
          !resolvedTheme?.includes("dark"),
      })}
    >
      <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
        <div className="flex flex-col w-full xl:max-w-[360px] gap-y-4">
          <div className="text-xl font-semibold">{t("workflows.empty_state.upgrade.title")}</div>
          <div className="font-medium text-custom-text-300">{t("workflows.empty_state.upgrade.description")}</div>
          <div className="flex mt-6 gap-4 flex-wrap">
            <UpgradeEmptyStateButton workspaceSlug={workspaceSlug?.toString()} flag={E_FEATURE_FLAGS.WORKFLOWS} />
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
      <Image
        src={resolvedTheme === "dark" ? WorkflowsUpgradeDark : WorkflowsUpgradeLight}
        alt=""
        className="max-h-[300px] self-end flex p-5 pb-0 xl:p-0"
      />
    </div>
  );
});
