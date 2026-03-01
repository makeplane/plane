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
import { EQUALITY_OPERATOR } from "@plane/types";
import type { TExternalInitiativeFilterExpression, TInitiativeFilterKeys } from "@/types/initiative";
import { EXTERNAL_INITIATIVE_FILTER_OPERATOR_SEPARATOR } from "@/types/initiative";

export class InitiativesFilterAdapter extends SeparatorBasedFilterAdapter<
  TInitiativeFilterKeys,
  TExternalInitiativeFilterExpression
> {
  protected config = {
    operatorSeparator: EXTERNAL_INITIATIVE_FILTER_OPERATOR_SEPARATOR,
    defaultOperator: EQUALITY_OPERATOR.EXACT,
    handleArrayAsCommaSeparated: true,
  };

  protected _createEmptyExpression(): TExternalInitiativeFilterExpression {
    return {};
  }
}
