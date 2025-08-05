import { FC } from "react";
import { IWorkspaceSidebarNavigationItem } from "@plane/constants";
import { SidebarItemBase } from "@/components/workspace/sidebar/sidebar-item";

type Props = {
  item: IWorkspaceSidebarNavigationItem;
};

export const SidebarItem: FC<Props> = ({ item }) => <SidebarItemBase item={item} />;
