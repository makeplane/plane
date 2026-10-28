/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { AttachOutline, LinkOutline, SubWorkItemsOutline } from "@makeplane/propel/icons";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { Pill, PillLabel } from "@makeplane/propel/elements/pill";
import { useTranslation } from "@plane/i18n";
import type { IIssueDisplayProperties } from "@plane/types";
// components
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/with-display-properties-HOC";
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

type CountPillProps = {
  icon: ReactNode;
  count: number;
  tooltip: string;
};

/** A display-only outlined count chip (sub-work items, attachments, links). */
function CountPill({ icon, count, tooltip }: CountPillProps) {
  return (
    <Tooltip label={tooltip}>
      <Pill
        size="sm"
        variant="outline"
        aria-label={tooltip}
        render={(pillProps) => {
          const { type: _buttonType, ...spanProps } = pillProps as typeof pillProps & { type?: string };
          return <span {...spanProps} role="img" className={`${spanProps.className ?? ""} cursor-[inherit]`} />;
        }}
      >
        <Icon icon={icon} />
        <PillLabel>{count}</PillLabel>
      </Pill>
    </Tooltip>
  );
}

export const IssueProperties = observer(function IssueProperties(props: IIssueProperties) {
  const { issue, displayProperties, className } = props;
  // i18n
  const { t } = useTranslation();

  if (!displayProperties || !issue.project_id) return null;

  return (
    <div className={className}>
      {/* basic properties */}
      {/* state */}
      {issue.state_id && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="state">
          <div className="h-6">
            <IssueBlockState stateId={issue.state_id} />
          </div>
        </WithDisplayPropertiesHOC>
      )}

      {/* priority */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="priority">
        <div className="h-6">
          <IssueBlockPriority priority={issue.priority} />
        </div>
      </WithDisplayPropertiesHOC>

      {/* label */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="labels">
        <div className="h-6 max-w-full min-w-0">
          <IssueBlockLabels labelIds={issue.label_ids} />
        </div>
      </WithDisplayPropertiesHOC>

      {/* start date */}
      {issue?.start_date && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="start_date">
          <div className="h-6">
            <IssueBlockDate date={issue?.start_date} stateId={issue?.state_id ?? undefined} type="start" />
          </div>
        </WithDisplayPropertiesHOC>
      )}

      {/* target/due date */}
      {issue?.target_date && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="due_date">
          <div className="h-6">
            <IssueBlockDate date={issue?.target_date} stateId={issue?.state_id ?? undefined} />
          </div>
        </WithDisplayPropertiesHOC>
      )}

      {/* assignee */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="assignee">
        <div className="h-6">
          <IssueBlockMembers memberIds={issue.assignee_ids} />
        </div>
      </WithDisplayPropertiesHOC>

      {/* modules */}
      {issue.module_ids && issue.module_ids.length > 0 && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="modules">
          <div className="h-6">
            <IssueBlockModules moduleIds={issue.module_ids} />
          </div>
        </WithDisplayPropertiesHOC>
      )}

      {/* cycles */}
      {issue.cycle_id && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="cycle">
          <div className="h-6">
            <IssueBlockCycle cycleId={issue.cycle_id} />
          </div>
        </WithDisplayPropertiesHOC>
      )}

      {/* extra render properties */}
      {/* sub-issues */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="sub_issue_count"
        shouldRenderProperty={(properties) => !!properties.sub_issue_count && !!issue.sub_issues_count}
      >
        <CountPill
          icon={<SubWorkItemsOutline />}
          count={issue.sub_issues_count}
          tooltip={`${t("common.sub_work_items")}: ${issue.sub_issues_count}`}
        />
      </WithDisplayPropertiesHOC>

      {/* attachments */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="attachment_count"
        shouldRenderProperty={(properties) => !!properties.attachment_count && !!issue.attachment_count}
      >
        <CountPill
          icon={<AttachOutline />}
          count={issue.attachment_count}
          tooltip={`${t("common.attachments")}: ${issue.attachment_count}`}
        />
      </WithDisplayPropertiesHOC>

      {/* link */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="link"
        shouldRenderProperty={(properties) => !!properties.link && !!issue.link_count}
      >
        <CountPill
          icon={<LinkOutline />}
          count={issue.link_count}
          tooltip={`${t("common.links")}: ${issue.link_count}`}
        />
      </WithDisplayPropertiesHOC>
    </div>
  );
});
