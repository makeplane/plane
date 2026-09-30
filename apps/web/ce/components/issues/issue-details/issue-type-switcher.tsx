/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
import { observer } from "mobx-react";
import { Layers } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { CustomSelect } from "@plane/ui";
import { SwitcherIcon } from "@/components/common/switcher-label";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useProjectIssueTypes } from "@/plane-web/hooks/use-project-issue-types";

export type TIssueTypeSwitcherProps = {
  issueId: string;
  disabled: boolean;
};

export const IssueTypeSwitcher = observer(function IssueTypeSwitcher(props: TIssueTypeSwitcherProps) {
  const { issueId, disabled } = props;
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const slug = workspaceSlug?.toString();
  const {
    issue: { getIssueById },
    updateIssue,
  } = useIssueDetail();
  const { getProjectById } = useProject();

  const issue = getIssueById(issueId);
  if (!issue?.project_id || !slug) return null;
  const projectId = issue.project_id;

  const project = getProjectById(projectId);
  const issueTypesEnabled = Boolean(project?.is_issue_type_enabled);
  const { types, isLoading } = useProjectIssueTypes(slug, issueTypesEnabled ? projectId : null);

  if (!issueTypesEnabled || types.length === 0) return null;

  const selected = types.find((row) => row.issue_type_id === issue.type_id)?.issue_type_detail;

  const onChange = async (value: string) => {
    if (!value || value === issue.type_id) return;
    await updateIssue(slug, projectId, issueId, { type_id: value });
  };

  return (
    <div className="h-7 max-w-xs min-w-0">
      <CustomSelect
        value={issue.type_id ?? ""}
        onChange={onChange}
        disabled={disabled || isLoading}
        buttonClassName="h-7 border border-subtle bg-layer-1 text-xs"
        label={
          selected ? (
            <span className="flex items-center gap-1.5 truncate">
              <SwitcherIcon logo_props={selected.logo_props} LabelIcon={Layers} size={12} />
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            t("work_item_types.select_placeholder")
          )
        }
        className="w-full"
        input
      >
        {types.map((row) => {
          const detail = row.issue_type_detail;
          if (!detail) return null;
          return (
            <CustomSelect.Option key={row.id} value={row.issue_type_id}>
              <span className="flex items-center gap-1.5">
                <SwitcherIcon logo_props={detail.logo_props} LabelIcon={Layers} size={12} />
                {detail.name}
              </span>
            </CustomSelect.Option>
          );
        })}
      </CustomSelect>
    </div>
  );
});
