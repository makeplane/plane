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
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { Tooltip } from "@plane/propel/tooltip";
import { Switch } from "@plane/propel/switch";
import { EProductSubscriptionEnum, EUserProjectRoles } from "@plane/types";
import { cn, getSubscriptionName } from "@plane/utils";
// ce imports
import type { TProperties } from "@/constants/project/settings/features";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store/use-workspace-subscription";

export type TIntakeFeatureList = {
  [key: string]: TProperties & {
    hasOptions: boolean;
    hasHyperlink?: boolean;
    canShuffle?: boolean;
  };
};
type Props = {
  projectId?: string;
  showDefault?: boolean;
  featureList: TIntakeFeatureList;
  isTooltip?: boolean;
  className?: string;
};
const IntakeSubFeaturesUpgrade = observer(function IntakeSubFeaturesUpgrade(props: Props) {
  const { projectId, showDefault = true, featureList, isTooltip = false, className = "" } = props;
  const { workspaceSlug } = useParams();
  const { allowPermissions } = useUserPermissions();
  const { togglePaidPlanModal } = useWorkspaceSubscription();

  if (!workspaceSlug || !projectId) return null;

  // Derived Values
  const isAdmin = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug.toString(),
    projectId
  );

  return (
    <>
      <div className={cn(isTooltip ? "divide-y divide-subtle-1/50" : "", className)}>
        {Object.keys(featureList)
          .filter((featureKey) => featureKey !== "in-app" || showDefault)
          .map((featureKey) => {
            const feature = featureList[featureKey];

            return (
              <div key={featureKey} className="gap-x-8 gap-y-3 py-3">
                <div key={featureKey} className="flex justify-between gap-2">
                  <div className="flex gap-2 w-full">
                    <div
                      className={cn("flex justify-center rounded-sm mt-1", {
                        "opacity-50": !isAdmin && featureKey !== "in_app",
                      })}
                    >
                      {feature.icon}
                    </div>
                    <div className="w-full">
                      <div className={cn("flex justify-between gap-2", {})}>
                        <div className="flex-1 w-full">
                          <div className="flex gap-2">
                            <div
                              className={cn("text-13 font-medium leading-5 align-top", {
                                "opacity-50": !isAdmin && featureKey !== "in_app",
                              })}
                            >
                              {feature.title}
                            </div>
                            {featureKey !== "in_app" && (
                              <div className="rounded-sm px-2 py-[1px] text-11 font-medium capitalize items-center text-plans-brand-primary bg-plans-brand-subtle">
                                <h1>{getSubscriptionName(EProductSubscriptionEnum.BUSINESS)}</h1>
                              </div>
                            )}
                          </div>
                          <p
                            className={cn("text-13 text-tertiary text-wrap mt-1", {
                              "opacity-50": !isAdmin && featureKey !== "in_app",
                            })}
                          >
                            {feature.description}
                          </p>
                        </div>
                        <div className={cn(!isTooltip && "flex items-center")}>
                          {featureKey !== "in_app" ? (
                            <Tooltip
                              tooltipContent={`Ask your Workspace Admin to upgrade.`}
                              position="top"
                              className=""
                              disabled={isAdmin}
                            >
                              <div
                                onClick={() => {
                                  if (!isAdmin) return;
                                  togglePaidPlanModal(true);
                                }}
                              >
                                <Switch
                                  value={false}
                                  onChange={() => {}}
                                  className={isAdmin ? "opacity-30" : ""}
                                  disabled={!isAdmin}
                                />
                              </div>
                            </Tooltip>
                          ) : (
                            <></>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
});

export default IntakeSubFeaturesUpgrade;
