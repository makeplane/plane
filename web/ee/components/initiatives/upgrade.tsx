"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
// import Link from "next/link";
import { useTheme } from "next-themes";
// ui
import { Button } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// assets
import InitiativesUpgradeDark from "@/public/empty-state/initiatives/upgrade-dark.webp";
import InitiativesUpgradeLight from "@/public/empty-state/initiatives/upgrade-light.webp";

export const InitiativesUpgrade: FC = observer(() => {
  const { resolvedTheme } = useTheme();

  return (
    <div className="pr-10">
      <div
        className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
          "bg-gradient-to-l from-[#3b5ec6] to-[#f5f7fe]": !resolvedTheme?.includes("dark"),
        })}
      >
        <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
          <div className="w-full xl:max-w-[300px]">
            <div className="text-2xl font-semibold">Track all your projects from one screen.</div>
            <div className="text-sm">
              Group projects like you group issues—by state, priority, or any other—and track their progress in one
              click.
            </div>
            <div className="flex mt-6 gap-4 flex-wrap">
              <Button disabled>Coming Soon</Button>
            </div>
          </div>
        </div>
        <Image
          src={resolvedTheme === "dark" ? InitiativesUpgradeDark : InitiativesUpgradeLight}
          alt=""
          className="max-h-[300px] self-end flex p-5 pb-0 xl:p-0"
        />
      </div>
    </div>
  );
});
