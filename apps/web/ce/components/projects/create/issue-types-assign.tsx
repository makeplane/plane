/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { Checkbox } from "@plane/ui";
import type { TIssueType } from "@plane/types";
import { IssueTypeService } from "@/services/issue-type.service";
import { SwitcherIcon } from "@/components/common/switcher-label";
import { Layers } from "lucide-react";

const issueTypeService = new IssueTypeService();

type TProps = {
  workspaceSlug: string;
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function ProjectCreateIssueTypesAssign(props: TProps) {
  const { workspaceSlug, value, onChange, disabled = false } = props;
  const { t } = useTranslation();
  const { data: types, isLoading } = useSWR(workspaceSlug ? `PROJECT_CREATE_ISSUE_TYPES_${workspaceSlug}` : null, () =>
    issueTypeService.listWorkspaceTypes(workspaceSlug, true)
  );

  const rows = (types ?? []) as TIssueType[];

  const toggleType = (typeId: string) => {
    if (disabled) return;
    if (value.includes(typeId)) {
      onChange(value.filter((id) => id !== typeId));
      return;
    }
    onChange([...value, typeId]);
  };

  if (isLoading) {
    return <p className="text-12 text-tertiary">{t("work_item_types.loading")}</p>;
  }

  if (rows.length === 0) {
    return <p className="text-12 text-tertiary">{t("project_create.features.work_item_types.no_types_hint")}</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-12 text-tertiary">{t("project_create.features.work_item_types.assign_hint")}</p>
      <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-subtle bg-surface-2 p-2">
        {rows.map((row) => (
          <li key={row.id}>
            <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-surface-1">
              <Checkbox checked={value.includes(row.id)} onChange={() => toggleType(row.id)} disabled={disabled} />
              <SwitcherIcon logo_props={row.logo_props} LabelIcon={Layers} size={14} />
              <span className="text-13 text-primary">{row.name}</span>
              {row.is_epic ? (
                <span className="rounded bg-surface-1 px-1.5 py-0.5 text-10 text-tertiary">
                  {t("workspace_settings.settings.work_item_types.epic_badge")}
                </span>
              ) : null}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
