/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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

export function WidgetLoader(props: Props) {
  const { widgetKey } = props;

  const loaders = {
    [EWidgetKeys.RECENT_ACTIVITY]: <RecentActivityWidgetLoader />,
    [EWidgetKeys.QUICK_LINKS]: <QuickLinksWidgetLoader />,
  };

  return loaders[widgetKey];
}
