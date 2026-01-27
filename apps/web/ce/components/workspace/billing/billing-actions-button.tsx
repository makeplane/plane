/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

export type TBillingActionsButtonProps = {
  canPerformWorkspaceAdminActions: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const BillingActionsButton = observer(function BillingActionsButton(props: TBillingActionsButtonProps) {
  return <></>;
});
