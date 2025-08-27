import { TAutomationActivityType } from "@plane/types";

export const AUTOMATION_ACTIVITY_TYPE_OPTIONS: {
  key: TAutomationActivityType;
  i18n_label: string;
}[] = [
  {
    key: "all",
    i18n_label: "automations.activity.filters.all",
  },
  {
    key: "activity",
    i18n_label: "automations.activity.filters.only_activity",
  },
  {
    key: "run_history",
    i18n_label: "automations.activity.filters.only_run_history",
  },
];
