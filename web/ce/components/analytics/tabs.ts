import { TAnalyticsTabsBase } from "@plane/types";
import { Overview } from "@/components/analytics/overview";
import { WorkItems } from "@/components/analytics/work-items";
export const ANALYTICS_TABS: {
  key: TAnalyticsTabsBase;
  i18nKey: string;
  content: React.FC;
  isExtended?: boolean;
}[] = [
  { key: "overview", i18nKey: "common.overview", content: Overview },
  { key: "work-items", i18nKey: "sidebar.work_items", content: WorkItems },
];
