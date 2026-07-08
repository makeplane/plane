/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { EditorRefApi } from "@plane/editor";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronDownIcon } from "@plane/propel/icons";
import type { TBulkIssueProperties, TIssue } from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useIssueTypes } from "@/hooks/store/use-issue-types";
import { useProject } from "@/hooks/store/use-project";

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
  showMandatoryFieldInfo?: boolean; // Show info about mandatory fields
  handleFormChange?: () => void;
};

export const IssueTypeSelect = observer(function IssueTypeSelect<T extends Partial<TIssueFields>>(
  props: TIssueTypeSelectProps<T>
) {
  const {
    control,
    projectId,
    disabled = false,
    placeholder,
    renderChevron = false,
    dropDownContainerClassName,
    handleFormChange,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { getProjectIssueTypes, getProjectIssueTypeIds, getProjectDefaultIssueTypeId, getIssueTypeById } =
    useIssueTypes();
  // form
  const { field } = useController({ control: control as unknown as Control<TIssue>, name: "type_id" });
  const value = field.value;
  // derived values
  const projectDetails = getProjectById(projectId);
  const issueTypes = getProjectIssueTypes(projectId, true)?.filter((issueType) => !issueType.is_epic);
  const defaultIssueTypeId = getProjectDefaultIssueTypeId(projectId);
  const selectedIssueType = getIssueTypeById(value);

  // pre-select the default work item type when none is selected, or when the
  // current selection does not belong to the selected project (e.g. project switch)
  useEffect(() => {
    if (!defaultIssueTypeId) return;
    const projectTypeIds = getProjectIssueTypeIds(projectId);
    const belongsToProject = value ? Boolean(projectTypeIds?.includes(value)) : false;
    if (!value || !belongsToProject) {
      field.onChange(defaultIssueTypeId);
      handleFormChange?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, defaultIssueTypeId]);

  if (!projectId || !projectDetails?.is_issue_type_enabled || !issueTypes || issueTypes.length === 0) return null;

  const options = issueTypes.map((issueType) => ({
    value: issueType.id,
    query: issueType.name,
    content: (
      <div className="flex items-center gap-1.5 truncate">
        <Logo logo={issueType.logo_props} size={14} />
        <span className="truncate">{issueType.name}</span>
      </div>
    ),
  }));

  return (
    <CustomSearchSelect
      value={value}
      onChange={(issueTypeId: string) => {
        field.onChange(issueTypeId);
        handleFormChange?.();
      }}
      options={options}
      disabled={disabled}
      className={dropDownContainerClassName}
      customButton={
        <div
          className={cn("flex items-center gap-1 rounded-sm border-[0.5px] border-strong px-2 py-1 text-11", {
            "cursor-not-allowed text-secondary": disabled,
            "cursor-pointer": !disabled,
          })}
        >
          {selectedIssueType ? (
            <div className="flex items-center gap-1.5 truncate">
              <Logo logo={selectedIssueType.logo_props} size={14} />
              <span className="truncate">{selectedIssueType.name}</span>
            </div>
          ) : (
            <span className="text-placeholder">{placeholder ?? t("work_item_types.label")}</span>
          )}
          {renderChevron && <ChevronDownIcon className="h-3 w-3 flex-shrink-0" aria-hidden="true" />}
        </div>
      }
    />
  );
});
