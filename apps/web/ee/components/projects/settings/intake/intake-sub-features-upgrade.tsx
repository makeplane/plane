import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { Tooltip } from "@plane/propel/tooltip";
import { EProductSubscriptionEnum, EUserProjectRoles } from "@plane/types";
import { ToggleSwitch, getSubscriptionTextAndBackgroundColor } from "@plane/ui";
import { cn, getSubscriptionName } from "@plane/utils";
// ce imports
import { TProperties } from "@/ce/constants/project";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { PaidPlanUpgradeModal } from "@/plane-web/components/license";

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
const IntakeSubFeaturesUpgrade = observer((props: Props) => {
  const { projectId, showDefault = true, featureList, isTooltip = false, className = "" } = props;
  const { workspaceSlug } = useParams();
  const { allowPermissions } = useUserPermissions();
  const [isPaidPlanModalOpen, togglePaidPlanModal] = useState(false);

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
      <PaidPlanUpgradeModal isOpen={isPaidPlanModalOpen} handleClose={() => togglePaidPlanModal(false)} />
      <div className={cn(isTooltip ? "divide-y divide-custom-border-200/50" : "mt-3", className)}>
        {Object.keys(featureList)
          .filter((featureKey) => featureKey !== "in-app" || showDefault)
          .map((featureKey) => {
            const feature = featureList[featureKey];

            return (
              <div key={featureKey} className={cn("gap-x-8 gap-y-3 bg-custom-background-100 py-3")}>
                <div key={featureKey} className={cn("flex justify-between gap-2", {})}>
                  <div className="flex gap-2 w-full">
                    <div
                      className={cn("flex justify-center rounded mt-1", {
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
                              className={cn("text-sm font-medium leading-5 align-top", {
                                "opacity-50": !isAdmin && featureKey !== "in_app",
                              })}
                            >
                              {feature.title}
                            </div>
                            {featureKey !== "in_app" && (
                              <div
                                className={cn(
                                  "rounded bg-custom-background-80 px-2 py-[1px] text-xs font-medium text-custom-text-300 capitalize items-center",
                                  getSubscriptionTextAndBackgroundColor(EProductSubscriptionEnum.BUSINESS)
                                )}
                              >
                                <h1>{getSubscriptionName(EProductSubscriptionEnum.BUSINESS)}</h1>
                              </div>
                            )}
                          </div>
                          <p
                            className={cn("text-sm text-custom-text-300 text-wrap mt-1", {
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
                                <ToggleSwitch
                                  value={false}
                                  onChange={(e) => {}}
                                  size="sm"
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
