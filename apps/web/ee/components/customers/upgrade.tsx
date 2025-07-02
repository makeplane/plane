"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// plane web imports
import { UpgradeEmptyStateButton } from "@/plane-web/components/workspace";
// assets
import CustomerUpgradeDark from "@/public/empty-state/customers/customer-upgrade-dark.webp";
import CustomerUpgradeLight from "@/public/empty-state/customers/customer-upgrade-light.webp";

export const CustomerUpgrade: FC = observer(() => {
  const { workspaceSlug } = useParams();
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <div className="">
        <div
          className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
            "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
            "bg-gradient-to-l from-[#3b5ec6] to-[#f5f7fe]": !resolvedTheme?.includes("dark"),
          })}
        >
          <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
            <div className="w-full xl:max-w-[300px]">
              <div className="text-2xl/7 font-semibold mb-2 line-">{t("customers.upgrade.title")}</div>
              <div className="text-sm">{t("customers.upgrade.description")}</div>
              <div className="mt-6">
                <UpgradeEmptyStateButton workspaceSlug={workspaceSlug?.toString()} flag={E_FEATURE_FLAGS.CUSTOMERS} />
              </div>
            </div>
          </div>
          <Image
            src={resolvedTheme === "dark" ? CustomerUpgradeDark : CustomerUpgradeLight}
            alt=""
            className="max-h-[300px] w-auto self-end flex p-5 pb-0 xl:p-0"
          />
        </div>
      </div>
    </>
  );
});
