/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

export type PaidPlanUpgradeModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

/** There are no paid plans in this fork, so the upgrade dialog never shows. */
export const PaidPlanUpgradeModal = observer(function PaidPlanUpgradeModal(_props: PaidPlanUpgradeModalProps) {
  return null;
});
