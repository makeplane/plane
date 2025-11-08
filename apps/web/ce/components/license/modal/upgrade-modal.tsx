"use client";

import type { FC } from "react";
import { observer } from "mobx-react";

export type PaidPlanUpgradeModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

/**
 * Upgrade modal disabled - all features enabled by default
 * This is now a no-op component to prevent breaking existing references
 */
export const PaidPlanUpgradeModal: FC<PaidPlanUpgradeModalProps> = observer((props) => {
  // Modal disabled - all features available
  return null;
});
