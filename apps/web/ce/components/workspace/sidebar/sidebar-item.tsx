import type { FC } from "react";
import type { IWorkspaceSidebarNavigationItem } from "@plane/constants";
import { SidebarItemBase } from "@/components/workspace/sidebar/sidebar-item";

type Props = {
  item: IWorkspaceSidebarNavigationItem;
};

export function SidebarItem({ item }: Props) {
  return <SidebarItemBase item={item} />;
}
