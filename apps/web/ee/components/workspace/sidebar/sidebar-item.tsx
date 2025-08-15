import { FC } from "react";
import { useParams } from "next/navigation";
import { IWorkspaceSidebarNavigationItem } from "@plane/constants";
import { SidebarItemBase } from "@/components/workspace/sidebar/sidebar-item";
import { isSidebarFeatureEnabled } from "@/plane-web/helpers/dashboard.helper";
import { UpgradeBadge } from "../upgrade-badge";

type Props = {
  item: IWorkspaceSidebarNavigationItem;
};

export const SidebarItem: FC<Props> = ({ item }) => {
  const { workspaceSlug } = useParams();

  if (!isSidebarFeatureEnabled(item.key, workspaceSlug.toString())) return null;

  return (
    <SidebarItemBase
      item={item}
      additionalRender={(key) =>
        key === "active_cycles" ? (
          <div className="flex-shrink-0">
            <UpgradeBadge flag="WORKSPACE_ACTIVE_CYCLES" />
          </div>
        ) : null
      }
    />
  );
};
