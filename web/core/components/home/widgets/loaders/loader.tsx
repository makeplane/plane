// components
import { QuickLinksWidgetLoader } from "./quick-links";
import { RecentActivityWidgetLoader } from "./recent-activity";

// types

type Props = {
  widgetKey: EWidgetKeys;
};

export enum EWidgetKeys {
  RECENT_ACTIVITY = "recent_activity",
  QUICK_LINKS = "quick_links",
}

export const WidgetLoader: React.FC<Props> = (props) => {
  const { widgetKey } = props;

  const loaders = {
    [EWidgetKeys.RECENT_ACTIVITY]: <RecentActivityWidgetLoader />,
    [EWidgetKeys.QUICK_LINKS]: <QuickLinksWidgetLoader />,
  };

  return loaders[widgetKey];
};
