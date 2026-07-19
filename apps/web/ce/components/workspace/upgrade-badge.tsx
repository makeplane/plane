/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

type TUpgradeBadge = {
  className?: string;
  size?: "sm" | "md";
};

/**
 * Renders nothing on this instance. The "Pro" pill advertised plans that are not
 * for sale here, and several of the features it labelled have since been
 * reimplemented, so it had also become wrong. The signature is left untouched so
 * call sites keep compiling and the badge can be restored in a single edit.
 */
export function UpgradeBadge(_props: TUpgradeBadge) {
  return null;
}
