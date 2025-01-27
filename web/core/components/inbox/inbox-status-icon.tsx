import { AlertTriangle, CheckCircle2, Clock, Copy, XCircle } from "lucide-react";
import { TInboxIssueStatus, EInboxIssueStatus } from "@plane/constants";

const icons = {
  [EInboxIssueStatus.PENDING]: AlertTriangle,
  [EInboxIssueStatus.DECLINED]: XCircle,
  [EInboxIssueStatus.SNOOZED]: Clock,
  [EInboxIssueStatus.ACCEPTED]: CheckCircle2,
  [EInboxIssueStatus.DUPLICATE]: Copy,
};

export const InboxStatusIcon = ({
  type,
  size,
  className,
}: {
  type: TInboxIssueStatus;
  size?: number;
  className?: string;
}) => {
  const Icon = icons[type];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
};
