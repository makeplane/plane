import { IInsightField } from "./common";
import { TAnalyticsTabsExtended } from "@plane/types/src/analytics-extended";

export const ANALYTICS_INSIGHTS_FIELDS_EXTENDED: Record<TAnalyticsTabsExtended, IInsightField[]> = {
  users: [
    {
      key: "total_users",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.users",
      },
    },
    {
      key: "total_admins",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.admins",
      },
    },
    {
      key: "total_members",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.members",
      },
    },
    {
      key: "total_guests",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.guests",
      },
    },
  ],
  projects: [
    {
      key: "total_projects",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.projects",
      },
    },
    {
      key: "on_track_updates",
      i18nKey: "common.on_track",
    },
    {
      key: "off_track_updates",
      i18nKey: "common.off_track",
    },
    {
      key: "at_risk_updates",
      i18nKey: "common.at_risk",
    },
  ],
  cycles: [
    {
      key: "total_cycles",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.cycles",
      },
    },
    {
      key: "current_cycles",
      i18nKey: "cycles",
      i18nProps: {
        entity: "common.cycles",
        prefix: "current",
      },
    },
    {
      key: "upcoming_cycles",
      i18nKey: "cycles",
      i18nProps: {
        entity: "common.cycles",
        prefix: "common.upcoming",
      },
    },
    {
      key: "completed_cycles",
      i18nKey: "cycles",
      i18nProps: {
        entity: "common.cycles",
        prefix: "common.completed",
      },
    },
  ],
  modules: [
    {
      key: "total_modules",
      i18nKey: "workspace_analytics.total_modules",
    },
    {
      key: "completed_modules",
      i18nKey: "common.modules",
      i18nProps: {
        prefix: "common.completed",
      },
    },
    {
      key: "in_progress_modules",
      i18nKey: "common.modules",
      i18nProps: {
        prefix: "common.in_progress",
      },
    },
    {
      key: "planned_modules",
      i18nKey: "common.modules",
      i18nProps: {
        prefix: "common.planned",
      },
    },
    {
      key: "paused_modules",
      i18nKey: "common.modules",
      i18nProps: {
        prefix: "common.paused",
      },
    },
  ],
  intake: [
    {
      key: "total_intake",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "intake",
      },
    },
    {
      key: "accepted_intake",
      i18nKey: "inbox_issue.status.accepted.title",
    },
    {
      key: "rejected_intake",
      i18nKey: "inbox_issue.status.declined.title",
    },
    {
      key: "duplicate_intake",
      i18nKey: "inbox_issue.status.duplicate.title",
    },
  ],
};
