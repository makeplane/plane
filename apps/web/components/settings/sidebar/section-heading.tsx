/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { ListSectionHeading } from "@makeplane/propel/components/list";

/** Static category label above a group of settings sidebar rows. */
export function SettingsSidebarSectionHeading({ children }: { children: ReactNode }) {
  return <ListSectionHeading render={<div className="!h-8" />}>{children}</ListSectionHeading>;
}
