// icons
import { AlertTriangle, CheckCircle2, Clock, Copy, LucideIcon, XCircle } from "lucide-react";
// types
import { TInboxIssueSortingOrderByKeys, TInboxIssueSortingSortByKeys, TInboxIssueStatus } from "@plane/types";
// helpers
import { findHowManyDaysLeft } from "@/helpers/date-time.helper";
import { EInboxIssueStatus } from "@/helpers/inbox.helper";

export const INBOX_STATUS: {
  key: string;
  status: TInboxIssueStatus;
  icon: LucideIcon;
  title: string;
  description: (snoozedTillDate: Date) => string;
  textColor: (snoozeDatePassed: boolean) => string;
  bgColor: (snoozeDatePassed: boolean) => string;
}[] = [
  {
    key: "pending",
    status: EInboxIssueStatus.PENDING,
    icon: AlertTriangle,
    title: "Pending",
    description: () => `Pending`,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-[#AB6400]"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-[#FFF7C2]"),
  },
  {
    key: "declined",
    status: EInboxIssueStatus.DECLINED,
    icon: XCircle,
    title: "Declined",
    description: () => `Declined`,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-[#CE2C31]"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-[#FEEBEC]"),
  },
  {
    key: "snoozed",
    status: EInboxIssueStatus.SNOOZED,
    icon: Clock,
    title: "Snoozed",
    description: (snoozedTillDate: Date = new Date()) => `${findHowManyDaysLeft(snoozedTillDate)} days to go`,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "text-red-500" : "text-custom-text-400"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "bg-red-500/10" : "bg-[#E0E1E6]"),
  },
  {
    key: "accepted",
    status: EInboxIssueStatus.ACCEPTED,
    icon: CheckCircle2,
    title: "Accepted",
    description: () => `Accepted`,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-[#3E9B4F]"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-[#E9F6E9]"),
  },
  {
    key: "duplicate",
    status: EInboxIssueStatus.DUPLICATE,
    icon: Copy,
    title: "Duplicate",
    description: () => `Duplicate`,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-custom-text-200"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-gray-500/10"),
  },
];

export const INBOX_ISSUE_SOURCE = "in-app";

export const INBOX_ISSUE_ORDER_BY_OPTIONS: { key: TInboxIssueSortingOrderByKeys; label: string }[] = [
  {
    key: "issue__created_at",
    label: "Date created",
  },
  {
    key: "issue__updated_at",
    label: "Date updated",
  },
  {
    key: "issue__sequence_id",
    label: "ID",
  },
];

export const INBOX_ISSUE_SORT_BY_OPTIONS: { key: TInboxIssueSortingSortByKeys; label: string }[] = [
  {
    key: "asc",
    label: "Ascending",
  },
  {
    key: "desc",
    label: "Descending",
  },
];
