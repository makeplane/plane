/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  ModuleBacklog,
  ModuleCancelled,
  ModuleCompleted,
  ModuleInProgress,
  ModulePaused,
  ModulePlanned,
} from "@makeplane/propel/icons";

export type ModuleStatus = "backlog" | "planned" | "in-progress" | "paused" | "completed" | "cancelled";

/** @deprecated Use ModuleStatus instead. */
export type TModuleStatus = ModuleStatus;

export type ModuleStatusIconProps = {
  status: ModuleStatus;
  className?: string;
  height?: string;
  width?: string;
};

export function ModuleStatusIcon({ status, className, height = "12px", width = "12px" }: ModuleStatusIconProps) {
  if (status === "backlog") return <ModuleBacklog className={className} height={height} width={width} />;
  else if (status === "cancelled") return <ModuleCancelled className={className} height={height} width={width} />;
  else if (status === "completed") return <ModuleCompleted className={className} height={height} width={width} />;
  else if (status === "in-progress") return <ModuleInProgress className={className} height={height} width={width} />;
  else if (status === "paused") return <ModulePaused className={className} height={height} width={width} />;
  else return <ModulePlanned className={className} height={height} width={width} />;
}
