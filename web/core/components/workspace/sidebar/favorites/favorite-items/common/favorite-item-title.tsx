"use client";
import React, { FC } from "react";
import Link from "next/link";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  href: string;
  title: string;
  icon: JSX.Element;
  isSidebarCollapsed: boolean;
};

export const FavoriteItemTitle: FC<Props> = (props) => {
  const { href, title, icon, isSidebarCollapsed } = props;
  return (
    <>
      {isSidebarCollapsed ? (
        <Link
          href={href}
          className={cn(
            "group/project-item cursor-pointer relative group w-full flex items-center justify-center gap-1.5 rounded px-2 py-1 outline-none text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90 active:bg-custom-sidebar-background-90 truncate p-0 size-8 aspect-square mx-auto"
          )}
          draggable
        >
          <span className="flex items-center justify-center size-5">{icon}</span>
        </Link>
      ) : (
        <Link href={href} className="flex items-center gap-1.5 truncate w-full" draggable>
          <div className="flex items-center justify-center size-5">{icon}</div>
          <span className="text-sm leading-5 font-medium flex-1 truncate">{title}</span>
        </Link>
      )}
    </>
  );
};
