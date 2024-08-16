"use client";

import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@plane/ui";
import { cn } from "@/helpers/common.helper";
import StateDark from "@/public/projects/dark-upgrade.svg";
import StateLight from "@/public/projects/light-upgrade.svg";

const Upgrade = () => {
  const { resolvedTheme } = useTheme();

  return (
    <div
      className={cn("flex rounded-xl mt-5 ", {
        "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
        "bg-gradient-to-l from-[#3b5ec6] to-[#f5f7fe]": !resolvedTheme?.includes("dark"),
      })}
    >
      <div className={cn("flex w-full flex-col min-h-[25rem] justify-center relative pl-10 xl:w-1/3")}>
        <div className="w-full xl:max-w-[300px]">
          <div className="text-2xl font-semibold">Track all your projects from one screen.</div>
          <div className="text-sm">
            Projects like you group issues—by state, priority, or any other—and track their progress in one click.
          </div>
          <div className="flex mt-6">
            <Button variant="primary">Available on Pro</Button>
            <Link
              target="_blank"
              href="https://plane.so/contact"
              className={"bg-transparent underline text-sm text-custom-primary-200 my-auto ml-4 font-medium"}
              onClick={() => {}}
            >
              Get custom quote
            </Link>
          </div>
        </div>
      </div>
      <Image
        src={resolvedTheme === "dark" ? StateDark : StateLight}
        alt=""
        className="w-2/3 max-h-[300px] self-end hidden xl:flex"
      />
    </div>
  );
};

export const WorkspaceProjectStatesUpgrade: FC = () => (
  <div className="pr-10">
    <div className="flex items-center justify-between gap-2 border-b border-custom-border-200 pb-3">
      <div>
        <h3 className="text-xl font-medium">See progress overview for all projects.</h3>
        <span className="text-custom-sidebar-text-400 text-sm font-medium">
          State of Projects is a Plane-only feature for tracking progress of all your projects by any project property.
        </span>
      </div>
    </div>
    <Upgrade />
  </div>
);
