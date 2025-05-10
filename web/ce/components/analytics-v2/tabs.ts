import { TAnalyticsTabsV2Base } from "@plane/types";
import { Overview } from "@/components/analytics-v2/overview";
import { WorkItems } from "@/components/analytics-v2/work-items";
export const ANALYTICS_TABS: {
	key: TAnalyticsTabsV2Base;
	i18nKey: string;
	content: React.FC;
}[] = [
		{ key: "overview", i18nKey: "common.overview", content: Overview },
		{ key: "work-items", i18nKey: "sidebar.work_items", content: WorkItems },
	];
