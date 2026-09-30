/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useController, type Control, type Path } from "react-hook-form";
import { observer } from "mobx-react";
import { Layers } from "lucide-react";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { CustomSelect } from "@plane/ui";
import type { TBulkIssueProperties, TIssue } from "@plane/types";
import { SwitcherIcon } from "@/components/common/switcher-label";
import { useProject } from "@/hooks/store/use-project";
import { useProjectIssueTypes } from "@/plane-web/hooks/use-project-issue-types";

export type TIssueFields = TIssue & TBulkIssueProperties;

export type TIssueTypeDropdownVariant = "xs" | "sm";

export type TIssueTypeSelectProps<T extends Partial<TIssueFields>> = {
  control: Control<T>;
  projectId: string | null;
  editorRef?: React.MutableRefObject<EditorRefApi | null>;
  disabled?: boolean;
  variant?: TIssueTypeDropdownVariant;
  placeholder?: string;
  isRequired?: boolean;
  renderChevron?: boolean;
  dropDownContainerClassName?: string;
  showMandatoryFieldInfo?: boolean;
  handleFormChange?: () => void;
};

export const IssueTypeSelect = observer(function IssueTypeSelect<T extends Partial<TIssueFields>>(
  props: TIssueTypeSelectProps<T>
) {
  const { control, projectId, disabled = false, renderChevron = false, placeholder, handleFormChange } = props;
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const { getProjectById } = useProject();
  const slug = workspaceSlug?.toString();
  const project = projectId ? getProjectById(projectId) : undefined;
  const issueTypesEnabled = Boolean(project?.is_issue_type_enabled);

  const { field } = useController({
    control,
    name: "type_id" as Path<T>,
  });

  const { types, defaultTypeId, isLoading } = useProjectIssueTypes(slug, issueTypesEnabled ? projectId : null);

  useEffect(() => {
    if (!issueTypesEnabled || !projectId || field.value || !defaultTypeId) return;
    field.onChange(defaultTypeId);
  }, [issueTypesEnabled, projectId, field.value, defaultTypeId, field]);

  if (!projectId || !slug || !issueTypesEnabled || types.length === 0) {
    return null;
  }

  const selected = types.find((row) => row.issue_type_id === field.value)?.issue_type_detail;
  const buttonLabel = isLoading
    ? t("work_item_types.loading")
    : (selected?.name ?? placeholder ?? t("work_item_types.select_placeholder"));

  return (
    <div className="h-7 min-w-0 sm:max-w-[12rem]">
      <CustomSelect
        value={field.value ?? ""}
        onChange={(value: string) => {
          field.onChange(value || null);
          handleFormChange?.();
        }}
        disabled={disabled || isLoading}
        buttonClassName="w-full h-7 border border-subtle bg-layer-1 text-xs max-w-full truncate"
        label={
          selected ? (
            <span className="flex items-center gap-1.5 truncate">
              <SwitcherIcon logo_props={selected.logo_props} LabelIcon={Layers} size={12} />
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            buttonLabel
          )
        }
        className="w-full"
        noChevron={!renderChevron}
        tabIndex={0}
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
