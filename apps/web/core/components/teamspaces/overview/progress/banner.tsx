/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import { StartDatePropertyIcon } from "@plane/propel/icons";
import { Loader } from "@plane/ui";
// plane web imports
import { cn } from "@plane/utils";
import { useTeamspaces } from "@/plane-web/hooks/store";
import { useTeamspaceAnalytics } from "@/plane-web/hooks/store/teamspaces/use-teamspace-analytics";

type TTeamspaceProgressBannerProps = {
  teamspaceId: string;
};

export const TeamspaceProgressBanner = observer(function TeamspaceProgressBanner(props: TTeamspaceProgressBannerProps) {
  const { teamspaceId } = props;
  // store hooks
  const { getTeamspaceEntitiesLoaderById } = useTeamspaces();
  const { getTeamspaceProgressSummaryLoader, getTeamspaceProgressSummary } = useTeamspaceAnalytics();
  // derived values
  const teamspaceEntitiesLoader = getTeamspaceEntitiesLoaderById(teamspaceId);
  const teamspaceProgressSummaryLoader = getTeamspaceProgressSummaryLoader(teamspaceId);
  const teamspaceProgressSummary = getTeamspaceProgressSummary(teamspaceId);
  const isLoading = teamspaceEntitiesLoader === "init-loader" || teamspaceProgressSummaryLoader === "init-loader";
  const isUpdating = teamspaceProgressSummaryLoader === "mutation";
  const areIssuesOverdue = teamspaceProgressSummary && teamspaceProgressSummary.overdue_issues > 0;

  if (!isLoading && !areIssuesOverdue) return null;
  return (
    <div className="w-full h-full pt-1 pb-2.5">
      {isLoading ? (
        <Loader className="w-full h-8">
          <Loader.Item width="100%" height="100%" />
        </Loader>
      ) : (
        <div
          className={cn(
            "flex w-full h-8 py-0.5 px-4 items-center justify-between gap-2 text-body-xs-medium rounded-lg",
            {
              "text-danger-primary bg-danger-subtle": areIssuesOverdue,
              "text-success-primary bg-success-subtle": !areIssuesOverdue,
            }
          )}
        >
          <div className="flex items-center gap-1.5">
            {areIssuesOverdue ? (
              <StartDatePropertyIcon className="size-4 flex-shrink-0" />
            ) : (
              <Logo
                logo={{
                  emoji: {
                    url: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f60d.png",
                    value: "128525",
                  },
                  in_use: "emoji",
                }}
                size={16}
              />
            )}
            {areIssuesOverdue
              ? `${teamspaceProgressSummary.overdue_issues} work items are overdue`
              : "You are doing great!!"}
            {areIssuesOverdue && (
              <Logo
                logo={{
                  emoji: {
                    url: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f615.png",
                    value: "128533",
                  },
                  in_use: "emoji",
                }}
                size={16}
              />
            )}
          </div>
          {isUpdating && <Spinner size={14} className="animate-spin flex-shrink-0 mx-1" />}
        </div>
      )}
    </div>
  );
});
