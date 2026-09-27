/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { EIconSize } from "@plane/constants";
import { LabelPropertyIcon, MembersPropertyIcon, ModuleIcon, PriorityIcon, StateGroupIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
import { Avatar } from "@plane/ui";
import { findTotalDaysInRange, getFileURL } from "@plane/utils";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useProjectState } from "@/hooks/store/use-project-state";
import type { TGanttColumnKey } from "@/hooks/use-gantt-preferences";

export const GANTT_COLUMN_DEFINITIONS: {
  key: TGanttColumnKey;
  i18nKey: string;
  required?: boolean;
}[] = [
  { key: "work_item", i18nKey: "gantt.columns.work_item", required: true },
  { key: "status", i18nKey: "gantt.columns.status" },
  { key: "assignee", i18nKey: "gantt.columns.assignee" },
  { key: "duration", i18nKey: "common.duration" },
  { key: "priority", i18nKey: "gantt.columns.priority" },
  { key: "module", i18nKey: "gantt.columns.module" },
  { key: "labels", i18nKey: "gantt.columns.labels" },
  { key: "start_date", i18nKey: "gantt.columns.start_date" },
  { key: "target_date", i18nKey: "gantt.columns.target_date" },
  { key: "estimate", i18nKey: "gantt.columns.estimate" },
];

type ColumnCellProps = {
  columnKey: TGanttColumnKey;
  issue: TIssue;
  isEpic?: boolean;
};

export const TimelineColumnCell = observer(function TimelineColumnCell(props: ColumnCellProps) {
  const { columnKey, issue } = props;
  const { t } = useTranslation();
  const { getProjectStates } = useProjectState();
  const { getUserDetails } = useMember();
  const { getLabelById } = useLabel();
  const { getModuleById } = useModule();

  const stateDetails = getProjectStates(issue.project_id)?.find((s) => s.id === issue.state_id);

  switch (columnKey) {
    case "work_item":
      if (!issue.project_id) return null;
      return (
        <IssueIdentifier
          issueId={issue.id}
          projectId={issue.project_id}
          size="xs"
          variant="tertiary"
          displayProperties={{ key: true }}
        />
      );
    case "status":
      if (!stateDetails) return <span className="text-13 text-tertiary">—</span>;
      return (
        <div className="flex min-w-0 items-center gap-1.5 truncate" title={stateDetails.name}>
          <StateGroupIcon
            stateGroup={stateDetails.group}
            color={stateDetails.color}
            size={EIconSize.SM}
            percentage={stateDetails.order}
            className="flex-shrink-0"
          />
          <span className="truncate text-13 text-secondary">{stateDetails.name}</span>
        </div>
      );
    case "assignee": {
      const assigneeIds = issue.assignee_ids ?? [];
      if (assigneeIds.length === 0) {
        return <MembersPropertyIcon className="h-4 w-4 flex-shrink-0 text-tertiary" />;
      }
      const first = getUserDetails(assigneeIds[0]);
      return (
        <div className="flex min-w-0 items-center gap-1 truncate">
          {first && <Avatar name={first.display_name} src={getFileURL(first.avatar_url)} size="sm" showTooltip />}
          {assigneeIds.length > 1 && <span className="text-11 text-tertiary">+{assigneeIds.length - 1}</span>}
        </div>
      );
    }
    case "duration": {
      const days = findTotalDaysInRange(issue.start_date, issue.target_date);
      if (!days) return <span className="text-13 text-tertiary">—</span>;
      return (
        <span className="text-13 text-secondary">
          {days} {days > 1 ? t("gantt.days") : t("gantt.day")}
        </span>
      );
    }
    case "priority":
      return <PriorityIcon priority={issue.priority} withContainer className="flex-shrink-0" />;
    case "start_date":
      return <span className="truncate text-13 text-secondary">{issue.start_date ?? "—"}</span>;
    case "target_date":
      return <span className="truncate text-13 text-secondary">{issue.target_date ?? "—"}</span>;
    case "module": {
      const moduleIds = issue.module_ids ?? [];
      if (moduleIds.length === 0) return <span className="text-13 text-tertiary">—</span>;

      const moduleNames = moduleIds.flatMap((moduleId) => {
        const name = getModuleById(moduleId)?.name;
        return name ? [name] : [];
      });
      if (moduleNames.length === 0) return <span className="text-13 text-tertiary">—</span>;

      const moduleText = moduleNames.join(", ");
      return (
        <div className="flex min-w-0 items-center gap-1.5" title={moduleText}>
          <ModuleIcon className="h-3.5 w-3.5 flex-shrink-0 text-tertiary" />
          <span className="truncate text-13 text-secondary">{moduleText}</span>
        </div>
      );
    }
    case "labels": {
      const labelIds = issue.label_ids ?? [];
      if (labelIds.length === 0) return <span className="text-13 text-tertiary">—</span>;

      const labels = labelIds.flatMap((labelId) => {
        const label = getLabelById(labelId);
        return label ? [label] : [];
      });
      if (labels.length === 0) return <span className="text-13 text-tertiary">—</span>;

      const labelText = labels.map((label) => label.name).join(", ");
      return (
        <div className="flex min-w-0 items-center gap-1.5" title={labelText}>
          {labels[0]?.color ? (
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: labels[0].color }}
            />
          ) : (
            <LabelPropertyIcon className="h-3.5 w-3.5 flex-shrink-0 text-tertiary" />
          )}
          <span className="truncate text-13 text-secondary">{labelText}</span>
        </div>
      );
    }
    case "estimate":
      return <span className="truncate text-13 text-tertiary">—</span>;
    default:
      return null;
  }
});
