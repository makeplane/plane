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

import { SeparatorBasedFilterAdapter } from "@plane/shared-state";
import type { TDashboardWidgetFilterKeys, TExternalDashboardWidgetFilterExpression } from "@plane/types";
import { EQUALITY_OPERATOR, EXTERNAL_WIDGET_OPERATOR_SEPARATOR } from "@plane/types";

export class DashboardWidgetFilterAdapter extends SeparatorBasedFilterAdapter<
  TDashboardWidgetFilterKeys,
  TExternalDashboardWidgetFilterExpression
> {
  protected config = {
    operatorSeparator: EXTERNAL_WIDGET_OPERATOR_SEPARATOR,
    defaultOperator: EQUALITY_OPERATOR.EXACT,
    handleArrayAsCommaSeparated: true,
  };

  protected _createEmptyExpression(): TExternalDashboardWidgetFilterExpression {
    return {};
  }
}
