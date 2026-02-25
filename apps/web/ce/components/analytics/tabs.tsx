/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { AnalyticsTab } from "@plane/types";
import { Overview } from "@/components/analytics/overview";
import { WorkItems } from "@/components/analytics/work-items";
import { Projects } from "@/components/analytics/projects";
import { Users } from "@/components/analytics/users";
import { Cycles } from "@/components/analytics/cycles";
import { Modules } from "@/components/analytics/modules";
import { Intake } from "@/components/analytics/intake";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAnalyticsTabs = (t: (key: string, params?: Record<string, any>) => string): AnalyticsTab[] => [
  { key: "overview", label: t("common.overview"), content: Overview, isDisabled: false },
  { key: "projects", label: t("sidebar.projects"), content: Projects, isDisabled: false },
  { key: "users", label: t("sidebar.users"), content: Users, isDisabled: false },
  { key: "work-items", label: t("sidebar.work_items"), content: WorkItems, isDisabled: false },
  { key: "cycles", label: t("sidebar.cycles"), content: Cycles, isDisabled: false },
  { key: "modules", label: t("sidebar.modules"), content: Modules, isDisabled: false },
  { key: "intake", label: t("sidebar.intake"), content: Intake, isDisabled: false },
];
