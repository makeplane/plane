/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { ReactNode } from "react";
import type { ActivityTab } from "../types";
import { ActivityHeader } from "../activity-header/activity-header";

export type ActivityFeedProps = {
  tabs: ActivityTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  actionsElement?: ReactNode;
  children?: ReactNode;
};

export function ActivityFeed(props: ActivityFeedProps) {
  const { tabs, activeTab, onTabChange, actionsElement, children } = props;

  return (
    <div className="flex flex-col">
      <ActivityHeader tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} actionsElement={actionsElement} />
      {children}
    </div>
  );
}
