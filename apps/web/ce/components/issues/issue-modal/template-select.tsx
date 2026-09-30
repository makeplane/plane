/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
import useSWR from "swr";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CustomSelect } from "@plane/ui";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// services
import { WorkItemTemplateService } from "@/services/work-item-template.service";

const workItemTemplateService = new WorkItemTemplateService();

export type TWorkItemTemplateDropdownSize = "xs" | "sm";

export type TWorkItemTemplateSelect = {
  projectId: string | null;
  typeId: string | null;
  disabled?: boolean;
  size?: TWorkItemTemplateDropdownSize;
  placeholder?: string;
  renderChevron?: boolean;
  dropDownContainerClassName?: string;
  handleModalClose: () => void;
  handleFormChange?: () => void;
};

export const WorkItemTemplateSelect = observer(function WorkItemTemplateSelect(props: TWorkItemTemplateSelect) {
  const { projectId, disabled = false, renderChevron = false, handleFormChange } = props;
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const { workItemTemplateId, setWorkItemTemplateId } = useIssueModal();

  const { data: templates, isLoading } = useSWR(
    workspaceSlug && projectId ? `WORK_ITEM_TEMPLATES_${String(workspaceSlug)}_${projectId}` : null,
    () => workItemTemplateService.list(String(workspaceSlug), projectId)
  );

  if (!projectId || !workspaceSlug) {
    return null;
  }

  const selectedLabel = (templates ?? []).find((x) => x.id === workItemTemplateId)?.name;
  const buttonLabel = isLoading
    ? t("work_item_templates.loading")
    : (selectedLabel ?? t("work_item_templates.dropdown_placeholder"));

  return (
    <div className="h-7 min-w-0 sm:max-w-[12rem]">
      <CustomSelect
        value={workItemTemplateId ?? ""}
        onChange={(value: string) => {
          if (!value) {
            setWorkItemTemplateId(null);
            return;
          }
          setWorkItemTemplateId(String(value));
          handleFormChange?.();
        }}
        disabled={disabled || isLoading}
        buttonClassName="w-full h-7 border border-subtle bg-layer-1 text-xs max-w-full truncate"
        label={buttonLabel}
        className="w-full"
        noChevron={!renderChevron}
        tabIndex={0}
        input
      >
        <CustomSelect.Option value="">{t("work_item_templates.none")}</CustomSelect.Option>
        {(templates ?? []).map((tmpl) => (
          <CustomSelect.Option key={tmpl.id} value={tmpl.id}>
            {tmpl.name}
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    </div>
  );
});
