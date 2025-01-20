import { subDays } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock, Copy, LucideIcon, XCircle } from "lucide-react";
import { INBOX_STATUS as INBOX_STATUS_CONSTANTS } from "@plane/constants";
import { TInboxIssueStatus } from "@plane/types";
import { renderFormattedPayloadDate } from "./date-time.helper";

export enum EInboxIssueCurrentTab {
  OPEN = "open",
  CLOSED = "closed",
}

export enum EInboxIssueStatus {
  PENDING = -2,
  DECLINED = -1,
  SNOOZED = 0,
  ACCEPTED = 1,
  DUPLICATE = 2,
}

export enum EPastDurationFilters {
  TODAY = "today",
  YESTERDAY = "yesterday",
  LAST_7_DAYS = "last_7_days",
  LAST_30_DAYS = "last_30_days",
}

export const getCustomDates = (duration: EPastDurationFilters): string => {
  const today = new Date();
  let firstDay, lastDay;

  switch (duration) {
    case EPastDurationFilters.TODAY: {
      firstDay = renderFormattedPayloadDate(today);
      lastDay = renderFormattedPayloadDate(today);
      return `${firstDay};after,${lastDay};before`;
    }
    case EPastDurationFilters.YESTERDAY: {
      const yesterday = subDays(today, 1);
      firstDay = renderFormattedPayloadDate(yesterday);
      lastDay = renderFormattedPayloadDate(yesterday);
      return `${firstDay};after,${lastDay};before`;
    }
    case EPastDurationFilters.LAST_7_DAYS: {
      firstDay = renderFormattedPayloadDate(subDays(today, 7));
      lastDay = renderFormattedPayloadDate(today);
      return `${firstDay};after,${lastDay};before`;
    }
    case EPastDurationFilters.LAST_30_DAYS: {
      firstDay = renderFormattedPayloadDate(subDays(today, 30));
      lastDay = renderFormattedPayloadDate(today);
      return `${firstDay};after,${lastDay};before`;
    }
  }
};

export const PAST_DURATION_FILTER_OPTIONS: {
  name: string;
  value: string;
}[] = [
  {
    name: "Today",
    value: EPastDurationFilters.TODAY,
  },
  {
    name: "Yesterday",
    value: EPastDurationFilters.YESTERDAY,
  },
  {
    name: "Last 7 days",
    value: EPastDurationFilters.LAST_7_DAYS,
  },
  {
    name: "Last 30 days",
    value: EPastDurationFilters.LAST_30_DAYS,
  },
];

const INBOX_STATUS_ICONS = {
  pending: AlertTriangle,
  declined: XCircle,
  snoozed: Clock,
  accepted: CheckCircle2,
  duplicate: Copy,
};

const INBOX_STATUS_KEYS = {
  pending: EInboxIssueStatus.PENDING,
  declined: EInboxIssueStatus.DECLINED,
  snoozed: EInboxIssueStatus.SNOOZED,
  accepted: EInboxIssueStatus.ACCEPTED,
  duplicate: EInboxIssueStatus.DUPLICATE,
};

export const INBOX_STATUS: {
  key: string;
  status: TInboxIssueStatus;
  icon: LucideIcon;
  title: string;
  description: () => string;
  textColor: (snoozeDatePassed: boolean) => string;
  bgColor: (snoozeDatePassed: boolean) => string;
}[] = INBOX_STATUS_CONSTANTS.map((s) => ({
  ...s,
  icon: INBOX_STATUS_ICONS[s.key as keyof typeof INBOX_STATUS_ICONS],
  status: INBOX_STATUS_KEYS[s.key as keyof typeof INBOX_STATUS_KEYS],
}));
