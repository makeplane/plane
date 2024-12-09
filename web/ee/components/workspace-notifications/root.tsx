// export * from "./sidebar";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useFlag } from "@/plane-web/hooks/store";

export const NotificationsSidebarRoot = () => {
  const { workspaceSlug } = useParams();
  const isFeatureEnabled = useFlag(workspaceSlug.toString(), "INBOX_STACKING");
  const NotificationsSideBarRoot = useMemo(
    () =>
      dynamic(
        () =>
          isFeatureEnabled
            ? import(`ee/components/workspace-notifications/sidebar`).then((module) => ({
                default: module["NotificationsSidebar"],
              }))
            : import("ce/components/workspace-notifications/root").then((module) => ({
                default: module["NotificationsSidebarRoot"],
              })),
        {
          // TODO: Add loading component
          loading: () => <></>,
        }
      ),
    [isFeatureEnabled]
  );

  return <NotificationsSideBarRoot />;
};
