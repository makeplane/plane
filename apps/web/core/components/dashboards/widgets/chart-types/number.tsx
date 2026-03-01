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
import type { TNumberWidgetConfig } from "@plane/types";
// local imports
import type { TWidgetComponentProps } from ".";

export const DashboardNumberWidget = observer(function DashboardNumberWidget(props: TWidgetComponentProps) {
  const { widget } = props;
  // derived values
  const { data, height } = widget ?? {};
  const widgetConfig = widget?.config as TNumberWidgetConfig | undefined;
  const selectedAlignment = widgetConfig?.text_alignment ?? "center";
  const textToDisplay = data?.data?.[0]?.count ?? 0;

  if (!widget) return null;

  return (
    <div className="size-full flex items-center px-4">
      <p
        className="w-full font-semibold text-primary truncate transition-all"
        style={{
          fontSize: (height ?? 1) * 1.7 + "rem",
          textAlign: selectedAlignment,
          color: widgetConfig?.text_color,
        }}
      >
        {textToDisplay}
      </p>
    </div>
  );
});
