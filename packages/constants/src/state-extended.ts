import { TStateAnalytics } from "@plane/types";

export const STATE_ANALYTICS_DETAILS: {
  key: keyof TStateAnalytics;
  title: string;
  color: string;
}[] = [
  {
    key: "backlog_issues",
    title: "Backlog",
    color: "#EBEDF2",
  },
  {
    key: "unstarted_issues",
    title: "Unstarted",
    color: "#6E6E6E80",
  },
  {
    key: "started_issues",
    title: "Started",
    color: "#FF813380",
  },
  {
    key: "completed_issues",
    title: "Completed",
    color: "#26D95080",
  },
  {
    key: "cancelled_issues",
    title: "Cancelled",
    color: "#FF333350",
  },
];
