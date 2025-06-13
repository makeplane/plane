// components
import { QuickLinksWidgetLoader } from "./quick-links";
import { RecentActivityWidgetLoader } from "./recent-activity";

// types

export const EWidgetKeys = {
  RECENT_ACTIVITY: "recent_activity",
  QUICK_LINKS: "quick_links",
} as const;

export type EWidgetKeys = typeof EWidgetKeys[keyof typeof EWidgetKeys];

type Props = {
  widgetKey: EWidgetKeys;
};

export const WidgetLoader: React.FC<Props> = (props) => {
  const { widgetKey } = props;

  const loaders = {
    [EWidgetKeys.RECENT_ACTIVITY]: <RecentActivityWidgetLoader />,
    [EWidgetKeys.QUICK_LINKS]: <QuickLinksWidgetLoader />,
  };

  return loaders[widgetKey];
};
