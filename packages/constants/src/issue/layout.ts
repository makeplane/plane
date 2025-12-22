import { EIssueLayoutTypes } from "@plane/types";

export type TIssueLayout = "list" | "kanban" | "calendar" | "spreadsheet" | "gantt";

export type TIssueLayoutMap = Record<
  EIssueLayoutTypes,
  {
    key: EIssueLayoutTypes;
    i18n_title: string;
    i18n_label: string;
  }
>;

export const SITES_ISSUE_LAYOUTS: {
  key: TIssueLayout;
  titleTranslationKey: string;
  icon: string;
}[] = [
  {
    key: "list",
    icon: "List",
    titleTranslationKey: "issue.layouts.list",
  },
  {
    key: "kanban",
    icon: "Kanban",
    titleTranslationKey: "issue.layouts.kanban",
  },
];

export const ISSUE_LAYOUT_MAP = {
  [EIssueLayoutTypes.LIST]: {
    key: EIssueLayoutTypes.LIST,
    i18n_title: "issue.layouts.title.list" as const,
    i18n_label: "issue.layouts.list" as const,
  },
  [EIssueLayoutTypes.KANBAN]: {
    key: EIssueLayoutTypes.KANBAN,
    i18n_title: "issue.layouts.title.kanban" as const,
    i18n_label: "issue.layouts.kanban" as const,
  },
  [EIssueLayoutTypes.CALENDAR]: {
    key: EIssueLayoutTypes.CALENDAR,
    i18n_title: "issue.layouts.title.calendar" as const,
    i18n_label: "issue.layouts.calendar" as const,
  },
  [EIssueLayoutTypes.SPREADSHEET]: {
    key: EIssueLayoutTypes.SPREADSHEET,
    i18n_title: "issue.layouts.title.spreadsheet" as const,
    i18n_label: "issue.layouts.spreadsheet" as const,
  },
  [EIssueLayoutTypes.GANTT]: {
    key: EIssueLayoutTypes.GANTT,
    i18n_title: "issue.layouts.title.gantt" as const,
    i18n_label: "issue.layouts.gantt" as const,
  },
} satisfies TIssueLayoutMap;

export const ISSUE_LAYOUTS: {
  key: EIssueLayoutTypes;
  i18n_title: string;
  i18n_label: string;
}[] = Object.values(ISSUE_LAYOUT_MAP);
