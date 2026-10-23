/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// hooks
import type { TSelectionHelper } from "@/hooks/use-multiple-select";

type Props = {
  className?: string;
  selectionHelpers: TSelectionHelper;
};

/**
 * Xplication: upstream renders a "buy Plane One" upgrade banner while items are selected.
 * Bulk operations are a paid-edition feature, so this fork renders nothing here.
 */
export const IssueBulkOperationsRoot = observer(function IssueBulkOperationsRoot(_props: Props) {
  return null;
});
