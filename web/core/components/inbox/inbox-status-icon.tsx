import { AlertTriangle, CheckCircle2, Clock, Copy, XCircle } from "lucide-react";
import { TInboxIssueStatus, EInboxIssueStatus } from "@plane/constants";

export const InboxStatusIcon = ({
  type,
  size,
  className,
}: {
  type: TInboxIssueStatus;
  size?: number;
  className?: string;
}) => {
  const icons = {
    [EInboxIssueStatus.PENDING]: AlertTriangle,
    [EInboxIssueStatus.DECLINED]: XCircle,
    [EInboxIssueStatus.SNOOZED]: Clock,
    [EInboxIssueStatus.ACCEPTED]: CheckCircle2,
    [EInboxIssueStatus.DUPLICATE]: Copy,
  };

  if (type === undefined) return null;
  const Icon = icons[type];
  return <Icon size={size} className={className} />;
};
