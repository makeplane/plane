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

import type { FC } from "react";
import React from "react";
import { omit } from "lodash-es";
// constants
import { STATE_ANALYTICS_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// types
import type { TStateAnalytics } from "@plane/types";
// ui
import { LinearProgressIndicator } from "@plane/ui";
// utils
import { cn } from "@plane/utils";
// local components
import { SectionWrapper } from "../common/section-wrapper";

type TProgressSectionProps = {
  title?: string;
  data: TStateAnalytics;
  indicatorElement?: React.ReactNode;
};

interface IProgressIndicatorData {
  id: number;
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export function ProgressSection(props: TProgressSectionProps) {
  const { data, indicatorElement } = props;

  const { t } = useTranslation();

  const totalIssues = data ? Object.values(omit(data, "overdue_issues")).reduce((acc, val) => acc + val, 0) : 0;

  const progressIndicatorData: IProgressIndicatorData[] = STATE_ANALYTICS_DETAILS.map((group, index) => ({
    id: index,
    name: group.title,
    value: data ? data[group.key] : 0,
    color: group.color,
    percentage: data && totalIssues > 0 ? (data[group.key] / totalIssues) * 100 : 0,
  }));

  return (
    <SectionWrapper>
      <div className="flex items-center gap-2">
        <h3 className="text-14 text-tertiary font-semibold">{t("common.progress")}</h3>
        {indicatorElement && <>{indicatorElement}</>}
      </div>

      <div className="flex flex-col gap-4">
        <LinearProgressIndicator
          size="xl"
          data={progressIndicatorData}
          barClassName="first:rounded-sm last:rounded-sm rounded"
          className="bg-transparent gap-0.5 rounded-sm p-0"
        />

        <div className="flex gap-4 justify-stretch flex-wrap w-full">
          {progressIndicatorData.map((item) => (
            <div key={item.id} className={cn("flex-1 flex flex-col gap-1 px-3 py-2 min-w-24")}>
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-sm flex-shrink-0"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
                <span className="text-6 font-medium leading-4 text-tertiary">{item.name}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-13 font-medium text-tertiary">{item.value}</span>
                <span className="text-13 font-medium text-tertiary my-auto">{Math.round(item.percentage)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
