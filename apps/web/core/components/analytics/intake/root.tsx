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

import React from "react";
import AnalyticsWrapper from "@/components/analytics/analytics-wrapper";
import TotalInsights from "@/components/analytics/total-insights";
import IntakeInsightTable from "./intake-insight-table";
import IntakeTrends from "./intake-trends";

function Intake() {
  return (
    <AnalyticsWrapper i18nTitle="intake">
      <div className="flex flex-col gap-14">
        <TotalInsights analyticsType="intake" />
        <IntakeTrends />
        <IntakeInsightTable />
      </div>
    </AnalyticsWrapper>
  );
}

export { Intake };
