/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { AttachOutline, LinkOutline, SubWorkItemsOutline } from "@makeplane/propel/icons";
// plane imports
import { WorkItemPropertiesList, WorkItemPropertyCountChip } from "@plane/blocks/work-item-properties";
import type { WorkItemPropertiesListProps } from "@plane/blocks/work-item-properties";
import { useTranslation } from "@plane/i18n";
import type { IIssueDisplayProperties } from "@plane/types";
// types
import type { IIssue } from "@/types/issue";
// local imports
import { IssueBlockCycle } from "./cycle";
import { IssueBlockDate } from "./due-date";
import { IssueBlockLabels } from "./labels";
import { IssueBlockMembers } from "./member";
import { IssueBlockModules } from "./modules";
import { IssueBlockPriority } from "./priority";
import { IssueBlockState } from "./state";

export interface IIssueProperties {
  issue: IIssue;
  displayProperties: IIssueDisplayProperties | undefined;
  className: string;
}

/**
 * A public work item's property chips, read-only, in row order. Builds the same entry list the
 * web app hands to `@plane/blocks`, and renders it with the shared wrapping list.
 */
export const IssueProperties = observer(function IssueProperties(props: IIssueProperties) {
  const { issue, displayProperties, className } = props;
  // i18n
  const { t } = useTranslation();

  if (!displayProperties || !issue.project_id) return null;

  const isShown = (key: keyof IIssueDisplayProperties) => !!displayProperties[key];
  const entries: WorkItemPropertiesListProps["entries"] = [];

  // basic properties
  if (isShown("state") && issue.state_id)
    entries.push({ key: "state", chip: <IssueBlockState stateId={issue.state_id} /> });
  if (isShown("priority")) entries.push({ key: "priority", chip: <IssueBlockPriority priority={issue.priority} /> });
  if (isShown("labels")) entries.push({ key: "labels", chip: <IssueBlockLabels labelIds={issue.label_ids} /> });
  if (isShown("start_date") && issue.start_date)
    entries.push({
      key: "start_date",
      chip: <IssueBlockDate date={issue.start_date} stateId={issue.state_id ?? undefined} type="start" />,
    });
  if (isShown("due_date") && issue.target_date)
    entries.push({
      key: "due_date",
      chip: <IssueBlockDate date={issue.target_date} stateId={issue.state_id ?? undefined} />,
    });
  if (isShown("assignee"))
    entries.push({ key: "assignee", chip: <IssueBlockMembers memberIds={issue.assignee_ids} /> });
  if (isShown("modules") && issue.module_ids && issue.module_ids.length > 0)
    entries.push({ key: "modules", chip: <IssueBlockModules moduleIds={issue.module_ids} /> });
  if (isShown("cycle") && issue.cycle_id)
    entries.push({ key: "cycle", chip: <IssueBlockCycle cycleId={issue.cycle_id} /> });

  // counts
  if (isShown("sub_issue_count") && !!issue.sub_issues_count)
    entries.push({
      key: "sub_issue_count",
      chip: (
        <WorkItemPropertyCountChip
          icon={<SubWorkItemsOutline />}
          count={issue.sub_issues_count}
          label={t("common.sub_work_items")}
        />
      ),
    });
  if (isShown("attachment_count") && !!issue.attachment_count)
    entries.push({
      key: "attachment_count",
      chip: (
        <WorkItemPropertyCountChip
          icon={<AttachOutline />}
          count={issue.attachment_count}
          label={t("common.attachments")}
        />
      ),
    });
  if (isShown("link") && !!issue.link_count)
    entries.push({
      key: "link",
      chip: <WorkItemPropertyCountChip icon={<LinkOutline />} count={issue.link_count} label={t("common.links")} />,
    });

  return <WorkItemPropertiesList className={className} entries={entries} />;
});
