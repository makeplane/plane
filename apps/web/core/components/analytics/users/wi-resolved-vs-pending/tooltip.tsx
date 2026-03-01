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
import type { NameType, Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";

import { useTranslation } from "@plane/i18n";
import { Card, ECardSpacing } from "@plane/propel/card";
import type { IUserLite } from "@plane/types";
import { UserAvatarName } from "../../user-avatar-name";

type TooltipItem = {
  key: string;
  label: string;
  value: number;
  isSubItem?: boolean;
  children?: TooltipItem[];
};

type Props = {
  active: boolean | undefined;
  label: string | undefined;
  payload: Payload<ValueType, NameType>[] | undefined;
  member?: IUserLite;
};

export const CustomTooltip = React.memo(function CustomTooltip(props: Props) {
  const { active, payload, member } = props;
  const { t } = useTranslation();

  if (!active || !payload || !payload.length) return null;

  const tooltipItems: TooltipItem[] = [];

  const topPayload = payload[0]?.payload;

  if (topPayload) {
    tooltipItems.push({
      key: "total",
      label: t("workspace_analytics.total", { entity: t("common.work_items") }),
      value: topPayload.total as number,
    });
  }

  if (topPayload?.completed_work_items) {
    tooltipItems.push({
      key: "resolved",
      label: t("common.resolved"),
      value: topPayload.completed_work_items as number,
    });
  }

  if (topPayload.pending > 0) {
    // Create pending item with nested children
    const pendingChildren: TooltipItem[] = [];

    if (topPayload.started_work_items) {
      pendingChildren.push({
        key: "started_work_items",
        label: t("workspace_projects.state.started"),
        value: topPayload.started_work_items,
        isSubItem: true,
      });
    }

    if (topPayload.un_started_work_items) {
      pendingChildren.push({
        key: "un_started_work_items",
        label: t("workspace_projects.state.unstarted"),
        value: topPayload.un_started_work_items,
        isSubItem: true,
      });
    }

    if (topPayload.backlog_work_items) {
      pendingChildren.push({
        key: "backlog_work_items",
        label: t("workspace_projects.state.backlog"),
        value: topPayload.backlog_work_items,
        isSubItem: true,
      });
    }

    tooltipItems.push({
      key: "pending",
      label: t("common.pending"),
      value: topPayload.pending,
      children: pendingChildren,
    });
  }

  return (
    <Card
      className="flex flex-col max-h-[40vh] w-[14rem] overflow-y-scroll vertical-scrollbar scrollbar-sm"
      spacing={ECardSpacing.SM}
    >
      {member && (
        <p className="flex-shrink-0 text-11 text-primary font-medium border-b border-subtle-1 pb-3 truncate">
          <UserAvatarName userId={member.id} />
        </p>
      )}
      <div className="flex flex-col gap-2">
        {tooltipItems.map((item) => (
          <div key={item.key} className="space-y-1">
            {/* Parent item */}
            <div className="flex items-center gap-2 text-11 transition-opacity justify-between text-tertiary font-medium">
              <span className="truncate">{item.label}</span>
              <span className="flex-shrink-0 font-medium">{item.value}</span>
            </div>

            {/* Children items with left border */}
            {item.children && item.children.length > 0 && (
              <div className="border-l border-subtle pl-2 flex flex-col gap-1">
                {item.children.map((child) => (
                  <div
                    key={child.key}
                    className="flex items-center gap-2 text-11 transition-opacity justify-between text-placeholder "
                  >
                    <span className="truncate">{child.label}</span>
                    <span className="flex-shrink-0 font-medium">{child.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
});
CustomTooltip.displayName = "CustomTooltip";
