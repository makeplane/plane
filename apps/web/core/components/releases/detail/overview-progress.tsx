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

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { Release } from "@plane/types";
import { LinearProgressIndicator } from "@plane/ui";
import { SectionWrapper } from "@/components/common/layout/main/common/section-wrapper";

type Props = {
  release: Release;
};

export const ReleaseOverviewProgress = observer(function ReleaseOverviewProgress(props: Props) {
  const { release } = props;
  const { t } = useTranslation();

  const total = release.work_item_ids?.length ?? 0;
  const completed = release.completed_work_item_count ?? 0;
  const cancelled = release.cancelled_work_item_count ?? 0;
  const pending = Math.max(0, total - completed - cancelled);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const progressData = [
    {
      id: 0,
      name: t("common.completed") ?? "Completed",
      value: completed,
      color: "var(--bg-success-primary)",
      percentage,
    },
    {
      id: 1,
      name: t("releases.pending_work_items") ?? "Pending",
      value: pending,
      color: "var(--border-subtle)",
      percentage: total > 0 ? 100 - percentage : 0,
    },
  ].filter((d) => d.value > 0);

  const barData =
    progressData.length > 0
      ? progressData
      : [{ id: 0, name: "", value: 1, color: "var(--border-subtle)", percentage: 0 }];

  return (
    <SectionWrapper>
      <h3 className="text-body-md-semibold text-tertiary">{t("common.progress") ?? "Progress"}</h3>
      <div className="flex flex-col gap-4">
        <LinearProgressIndicator
          size="xl"
          data={barData}
          barClassName="first:rounded-sm last:rounded-sm rounded"
          className="bg-transparent gap-0.5 rounded-sm p-0"
        />
        <div className="flex gap-6 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="text-body-sm-medium text-tertiary">{t("releases.completed_work_items")}</span>
            <span className="flex items-center gap-1">
              <span className="text-body-md-semibold text-primary">
                {completed}/{total}
              </span>
              <span className="text-caption-xs-regular text-secondary">{total > 0 ? `${percentage}%` : ""}</span>
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-body-sm-medium text-tertiary">{t("releases.pending_work_items")}</span>
            <span className="text-body-md-semibold text-primary">{pending}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-body-sm-medium text-tertiary">
              {t("releases.cancelled_work_items") ?? "Cancelled work items"}
            </span>
            <span className="text-body-md-semibold text-primary">{release.cancelled_work_item_count ?? 0}</span>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
});
