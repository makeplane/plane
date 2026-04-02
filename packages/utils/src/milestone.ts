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

import type { TMilestoneIconVariant, TMilestoneProgress } from "@plane/types";

// TODO-design-system -> update color tokens here
const MILESTONE_VARIANT_COLORS: Record<TMilestoneIconVariant, { base: string; hover?: string }> = {
  default: { base: "#455068", hover: "#5a6b8a" },
  done: { base: "#1FAD40", hover: "#26d451" },
  in_progress: { base: "#004EFF", hover: "#3d7aff" },
  not_started_yet: { base: "#FF0000", hover: "#ff3333" },
  started_no_progress: { base: "#FF9500", hover: "#ffab33" },
  custom: { base: "" },
};

const getMilestoneVariantFromProgress = (progress: number) => {
  if (progress === 100) return "done";
  if (progress === 0) return "not_started_yet";
  if (progress > 0 && progress < 100) return "in_progress";
  return "started_no_progress";
};

export const getMilestoneProgressPercentage = (progress: TMilestoneProgress): number => {
  const { total_items, completed_items, cancelled_items } = progress;

  if (total_items === 0) return 0;

  const completedOrCancelled = completed_items + cancelled_items;
  const percentage = (completedOrCancelled / total_items) * 100;

  return Math.round(percentage);
};

export const getMilestoneIconProps = (progress: number): { fill: string; isDone: boolean } => {
  const variant = getMilestoneVariantFromProgress(progress);
  const fill = MILESTONE_VARIANT_COLORS[variant].base;
  return { fill, isDone: variant === "done" };
};

export const getMilestoneLineColors = (progress: number): { base: string; hover: string } => {
  const variant = getMilestoneVariantFromProgress(progress);
  const { base, hover } = MILESTONE_VARIANT_COLORS[variant];
  return { base, hover: hover || base };
};
