// icons
import { AlertTriangle, CheckCircle2, Clock, Copy, LucideIcon, XCircle } from "lucide-react";
// helpers
import { findHowManyDaysLeft } from "helpers/date-time.helper";
// types
import { TInboxIssueOrderByOptions } from "@plane/types";

export const INBOX_STATUS: {
  key: string;
  status: number;
  icon: LucideIcon;
  title: string;
  description: (snoozedTillDate: Date) => JSX.Element;
  textColor: (snoozeDatePassed: boolean) => string;
  bgColor: (snoozeDatePassed: boolean) => string;
}[] = [
  {
    key: "pending",
    status: -2,
    icon: AlertTriangle,
    title: "Pending",
    description: () => <></>,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-[#AB6400]"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-[#FFF7C2]"),
  },
  {
    key: "declined",
    status: -1,
    icon: XCircle,
    title: "Declined",
    description: () => <></>,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-[#CE2C31]"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-[#FEEBEC]"),
  },
  {
    key: "snoozed",
    status: 0,
    icon: Clock,
    title: "Snoozed",
    description: (snoozedTillDate: Date = new Date()) => (
      <p className="text-xs leading-4 font-medium text-custom-text-400">
        {findHowManyDaysLeft(snoozedTillDate)} days to go
      </p>
    ),
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "text-red-500" : "text-[#60646C"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "bg-red-500/10" : "bg-[#E0E1E6]"),
  },
  {
    key: "accepted",
    status: 1,
    icon: CheckCircle2,
    title: "Accepted",
    description: () => <></>,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-[#3E9B4F]"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-[#E9F6E9]"),
  },
  {
    key: "duplicate",
    status: 2,
    icon: Copy,
    title: "Duplicate",
    description: () => <></>,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-custom-text-200"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-gray-500/10"),
  },
];

export const INBOX_ISSUE_SOURCE = "in-app";

export const INBOX_ISSUE_ORDER_BY_OPTIONS: { key: TInboxIssueOrderByOptions; label: string }[] = [
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
