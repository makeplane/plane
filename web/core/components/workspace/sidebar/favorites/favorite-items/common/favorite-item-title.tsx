"use client";
import React, { FC } from "react";
import Link from "next/link";

type Props = {
  projectId: string | null;
  href: string;
  title: string;
  icon: JSX.Element;
  isSidebarCollapsed: boolean;
};

export const FavoriteItemTitle: FC<Props> = (props) => {
  const { projectId, href, title, icon, isSidebarCollapsed } = props;

  const linkClass = "flex items-center gap-1.5 truncate w-full";
  const collapsedClass =
    "group/project-item cursor-pointer relative group w-full flex items-center justify-center gap-1.5 rounded px-2 py-1 outline-none text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90 active:bg-custom-sidebar-background-90 truncate p-0 size-8 aspect-square mx-auto";

  const handleOnClick = () => {
    if (projectId) {
      const projectItem = document.getElementById(`${projectId}`);
      projectItem?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Link href={href} className={isSidebarCollapsed ? collapsedClass : linkClass} draggable onClick={handleOnClick}>
      <span className="flex items-center justify-center size-5">{icon}</span>
      {!isSidebarCollapsed && <span className="text-sm leading-5 font-medium flex-1 truncate">{title}</span>}
    </Link>
  );
};
