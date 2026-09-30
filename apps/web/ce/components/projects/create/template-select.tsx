/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { CustomSelect } from "@plane/ui";
import type { TProjectTemplate } from "@plane/types";
import { ProjectTemplateService } from "@/services/project-template.service";

const projectTemplateService = new ProjectTemplateService();

export type TProjectTemplateSelect = {
  disabled?: boolean;
  value?: string | null;
  onSelect?: (templateId: string | null) => void;
};

export function ProjectTemplateSelect(props: TProjectTemplateSelect) {
  const { disabled = false, value, onSelect } = props;
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { data: templates, isLoading } = useSWR(
    workspaceSlug ? `PROJECT_TEMPLATE_LIST_CREATE_${String(workspaceSlug)}` : null,
    () => projectTemplateService.list(String(workspaceSlug))
  );

  const selectedTemplate = (templates as TProjectTemplate[] | undefined)?.find((template) => template.id === value);
  const label = isLoading
    ? t("project_templates.loading")
    : (selectedTemplate?.name ?? t("project_templates.select_placeholder"));

  return (
    <div className="h-7 min-w-[11rem]">
      <CustomSelect
        value={value ?? ""}
        onChange={(next: string) => onSelect?.(next ? String(next) : null)}
        disabled={disabled || isLoading}
        buttonClassName="h-7 border border-subtle bg-custom-background-100 text-xs"
        className="h-7"
        label={label}
        noChevron
      >
        <CustomSelect.Option value="">{t("project_templates.none")}</CustomSelect.Option>
        {(templates as TProjectTemplate[] | undefined)?.map((template) => (
          <CustomSelect.Option key={template.id} value={template.id}>
            {template.name}
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    </div>
  );
}
