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

export const ISSUE_LAYOUT_MAP: TIssueLayoutMap = {
  [EIssueLayoutTypes.LIST]: {
    key: EIssueLayoutTypes.LIST,
    i18n_title: "issue.layouts.title.list",
    i18n_label: "issue.layouts.list",
  },
  [EIssueLayoutTypes.KANBAN]: {
    key: EIssueLayoutTypes.KANBAN,
    i18n_title: "issue.layouts.title.kanban",
    i18n_label: "issue.layouts.kanban",
  },
  [EIssueLayoutTypes.CALENDAR]: {
    key: EIssueLayoutTypes.CALENDAR,
    i18n_title: "issue.layouts.title.calendar",
    i18n_label: "issue.layouts.calendar",
  },
  [EIssueLayoutTypes.SPREADSHEET]: {
    key: EIssueLayoutTypes.SPREADSHEET,
    i18n_title: "issue.layouts.title.spreadsheet",
    i18n_label: "issue.layouts.spreadsheet",
  },
  [EIssueLayoutTypes.GANTT]: {
    key: EIssueLayoutTypes.GANTT,
    i18n_title: "issue.layouts.title.gantt",
    i18n_label: "issue.layouts.gantt",
  },
};

export const ISSUE_LAYOUTS: {
  key: EIssueLayoutTypes;
  i18n_title: string;
  i18n_label: string;
}[] = Object.values(ISSUE_LAYOUT_MAP);
