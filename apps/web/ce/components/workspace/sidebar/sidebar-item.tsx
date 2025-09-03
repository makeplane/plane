import { IWorkspaceSidebarNavigationItem } from "@plane/constants";
import { SidebarItemBase } from "@/components/workspace/sidebar/sidebar-item";

type Props = {
  item: IWorkspaceSidebarNavigationItem;
};

export const SidebarItem: React.FC<Props> = ({ item }) => <SidebarItemBase item={item} />;
