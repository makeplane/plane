import { Overview } from "@/components/analytics-v2/overview";
import { WorkItems } from "@/components/analytics-v2/work-items";
export const ANALYTICS_TABS = [
    { key: "overview", i18nKey: "common.overview", content: Overview },
    { key: "workitems", i18nKey: "sidebar.work_items", content: WorkItems },
];
