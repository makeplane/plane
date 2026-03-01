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

import { observer } from "mobx-react";
// plane imports
import { Loader } from "@plane/ui";
// plane web stores
import type { DashboardWidgetInstance } from "@/store/dashboards/widget";

type Props = {
  widget: DashboardWidgetInstance;
};

export const DashboardWidgetLoader = observer(function DashboardWidgetLoader(props: Props) {
  const {} = props;

  return (
    <Loader className="size-full px-4 pb-4">
      <Loader.Item height="100%" width="100%" />
    </Loader>
  );
});
