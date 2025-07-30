import { AlertTriangle, CheckCircle2, Clock, Copy, XCircle } from "lucide-react";
import { TInboxIssueStatus, EInboxIssueStatus } from "@plane/types";
import { cn } from "@plane/utils";

export const ICON_PROPERTIES = {
  [EInboxIssueStatus.PENDING]: {
    icon: AlertTriangle,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-[#AB6400]"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-[#FFF7C2]"),
  },
  [EInboxIssueStatus.DECLINED]: {
    icon: XCircle,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-[#CE2C31]"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-[#FEEBEC]"),
  },
  [EInboxIssueStatus.SNOOZED]: {
    icon: Clock,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "text-red-500" : "text-custom-text-400"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "bg-red-500/10" : "bg-[#E0E1E6]"),
  },
  [EInboxIssueStatus.ACCEPTED]: {
    icon: CheckCircle2,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-[#3E9B4F]"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-[#E9F6E9]"),
  },
  [EInboxIssueStatus.DUPLICATE]: {
    icon: Copy,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-custom-text-200"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-gray-500/10"),
  },
};
export const InboxStatusIcon = ({
  type,
  size,
  className,
  renderColor = true,
}: {
  type: TInboxIssueStatus;
  size?: number;
  className?: string;
  renderColor?: boolean;
}) => {
  if (type === undefined) return null;
  const Icon = ICON_PROPERTIES[type];
  if (!Icon) return null;
  return <Icon.icon size={size} className={cn(`w-3 h-3 ${renderColor && Icon?.textColor(false)}`, className)} />;
};
