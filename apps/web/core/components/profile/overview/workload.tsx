/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { STATE_GROUPS } from "@plane/constants";
// types
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import type { IUserStateDistribution } from "@plane/types";
import { Card, ECardDirection, ECardSpacing } from "@plane/ui";
import { Info } from "lucide-react";
// constants

type Props = {
  stateDistribution: IUserStateDistribution[];
};

export function ProfileWorkload({ stateDistribution }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-16 font-medium">
        {t("profile.stats.workload")}
        <Tooltip tooltipContent={t("profile.stats.workload_assigned_only")}>
          <Info className="size-3.5 text-custom-text-300 cursor-help" />
        </Tooltip>
      </h3>
      <div className="grid grid-cols-1 justify-stretch gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stateDistribution.map((group) => (
          <div key={group.state_group}>
            <div>
              <Card direction={ECardDirection.ROW} spacing={ECardSpacing.SM}>
                <div
                  className="h-3 w-3 rounded-xs my-2"
                  style={{
                    backgroundColor: STATE_GROUPS[group.state_group].color,
                  }}
                />
                <div className="space-y-1 flex-col">
                  <span className="text-13 text-placeholder">
                    {group.state_group === "unstarted"
                      ? "Not started"
                      : group.state_group === "started"
                        ? "Working on"
                        : STATE_GROUPS[group.state_group].label}
                  </span>
                  <p className="text-18 font-semibold">{group.state_count}</p>
                </div>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
