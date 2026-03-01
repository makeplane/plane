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

import { useMemo } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { useFlag } from "@/plane-web/hooks/store";
// local imports
import { Overview } from "./overview/root";
import { WorkItems } from "./work-items/root";
import { Cycles } from "./cycles/root";
import { Intake } from "./intake/root";
import { Modules } from "./modules/root";
import { Projects } from "./projects/root";
import { Users } from "./users/root";
import LockedTabLabel from "./locked-tab-label";

export const useAnalyticsTabs = (workspaceSlug: string) => {
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const isAnalyticsTabsEnabled = useFlag(workspaceSlug, "ANALYTICS_ADVANCED");

  const analyticsTabs = useMemo(
    () => [
      { key: "overview", label: t("common.overview"), content: Overview, isDisabled: false },
      {
        key: "projects",
        label: isAnalyticsTabsEnabled ? t("common.projects") : <LockedTabLabel label={t("common.projects")} t={t} />,
        content: Projects,
        isDisabled: !isAnalyticsTabsEnabled,
      },
      {
        key: "users",
        label: isAnalyticsTabsEnabled ? t("common.users") : <LockedTabLabel label={t("common.users")} t={t} />,
        content: Users,
        isDisabled: !isAnalyticsTabsEnabled,
      },
      { key: "work-items", label: t("sidebar.work_items"), content: WorkItems, isDisabled: false },
      {
        key: "cycles",
        label: isAnalyticsTabsEnabled ? t("common.cycles") : <LockedTabLabel label={t("common.cycles")} t={t} />,
        content: Cycles,
        isDisabled: !isAnalyticsTabsEnabled,
      },
      {
        key: "modules",
        label: isAnalyticsTabsEnabled ? t("common.modules") : <LockedTabLabel label={t("common.modules")} t={t} />,
        content: Modules,
        isDisabled: !isAnalyticsTabsEnabled,
      },
      {
        key: "intake",
        label: isAnalyticsTabsEnabled ? t("intake") : <LockedTabLabel label={t("intake")} t={t} />,
        content: Intake,
        isDisabled: !isAnalyticsTabsEnabled,
      },
    ],
    [t, isAnalyticsTabsEnabled]
  );

  return analyticsTabs;
};
