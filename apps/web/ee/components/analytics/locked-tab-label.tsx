import React from "react";
import { Lock } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { EProductSubscriptionEnum } from "@plane/types";
import { getSubscriptionTextAndBackgroundColor } from "@plane/ui";
import { cn } from "@plane/utils";

interface LockedTabLabelProps {
  label: React.ReactNode;
  t: (key: string, params?: Record<string, any>) => string;
}

const LockedTabLabel: React.FC<LockedTabLabelProps> = ({ label, t }) => (
  <Tooltip
    tooltipContent={
      <div className="text-xs bg-custom-background-100 rounded-md p-1 max-w-40">
        {t("workspace_analytics.upgrade_to_plan", {
          plan: (
            <span
              className={cn(
                getSubscriptionTextAndBackgroundColor(EProductSubscriptionEnum.PRO),
                "text-xs px-1 rounded"
              )}
            >
              {t("sidebar.pro")}
            </span>
          ),
          tab: label,
        })}
      </div>
    }
  >
    <div className="flex gap-2 justify-center items-center">
      {label} <Lock size={10} />
    </div>
  </Tooltip>
);

export default LockedTabLabel;
