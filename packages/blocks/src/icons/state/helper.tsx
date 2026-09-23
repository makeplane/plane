/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type IntakeStateGroup = "triage";

export type StateGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

export type StateIconSize = "xs" | "sm" | "md" | "lg" | "xl";

export const STATE_GROUP_COLORS: {
  [key in StateGroup]: string;
} = {
  backlog: "#60646C",
  unstarted: "#60646C",
  started: "#F59E0B",
  completed: "#46A758",
  cancelled: "#9AA4BC",
};

export const INTAKE_STATE_GROUP_COLORS: { [key in IntakeStateGroup]: string } = { triage: "#4E5355" };

export function getStateIconSize(size: StateIconSize): string {
  switch (size) {
    case "xs":
      return "10px";
    case "sm":
      return "12px";
    case "md":
      return "14px";
    case "lg":
      return "16px";
    case "xl":
      return "18px";
  }
}
