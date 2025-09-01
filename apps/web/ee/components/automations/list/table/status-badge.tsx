import React from "react";
// plane imports
import { EAutomationRunStatus } from "@plane/types";
import { cn, getAutomationRunStatusLabel } from "@plane/utils";

type TAutomationRunStatusBadgeVariant = "success" | "info" | "error" | "default";

type TAutomationRunStatusBadgeProps = {
  status: EAutomationRunStatus | null;
};

const variantStylesMap: Map<TAutomationRunStatusBadgeVariant, string> = new Map([
  ["success", "bg-green-500/10"],
  ["info", "bg-yellow-500/10"],
  ["error", "bg-red-500/10"],
  ["default", "bg-custom-background-80"],
]);

const statusToVariantMap: Map<EAutomationRunStatus, TAutomationRunStatusBadgeVariant> = new Map([
  [EAutomationRunStatus.PENDING, "info"],
  [EAutomationRunStatus.RUNNING, "default"],
  [EAutomationRunStatus.SUCCESS, "success"],
  [EAutomationRunStatus.FAILED, "error"],
  [EAutomationRunStatus.CANCELLED, "error"],
]);

export const AutomationRunStatusBadge: React.FC<TAutomationRunStatusBadgeProps> = (props) => {
  const { status } = props;
  // derived values
  const styles = status ? variantStylesMap.get(statusToVariantMap.get(status)!) : "text-custom-text-400";

  return (
    <div className={cn("inline-flex items-center p-1 rounded text-[9px] text-custom-text-200 font-medium", styles)}>
      {status ? getAutomationRunStatusLabel(status) : "--"}
    </div>
  );
};
