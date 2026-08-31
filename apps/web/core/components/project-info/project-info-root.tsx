/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
// components
import { ProjectCustomFieldValueInput } from "@/components/project-custom-fields";
// hooks
import { useProjectCustomField } from "@/hooks/store/use-project-custom-field";

// Falls back to this bucket for a field with no group_name (ad-hoc fields created
// through Settings > Custom Fields, which don't set one) rather than dropping it.
const UNGROUPED_LABEL_KEY = "project_custom_field.settings.project_info_page.ungrouped_section";

export const ProjectInfoRoot = observer(function ProjectInfoRoot() {
  const { workspaceSlug, projectId } = useParams();
  const { t } = useTranslation();
  const {
    getProjectCustomFields,
    getFieldValue,
    getFieldOptions,
    fetchProjectCustomFields,
    fetchProjectCustomFieldValues,
    fetchFieldOptions,
    setCustomFieldValue,
  } = useProjectCustomField();

  const customFields = getProjectCustomFields(projectId?.toString());

  useEffect(() => {
    if (!workspaceSlug || !projectId) return;
    fetchProjectCustomFields(workspaceSlug.toString(), projectId.toString());
    fetchProjectCustomFieldValues(workspaceSlug.toString(), projectId.toString());
  }, [workspaceSlug, projectId, fetchProjectCustomFields, fetchProjectCustomFieldValues]);

  useEffect(() => {
    if (!workspaceSlug || !projectId || !customFields) return;
    customFields
      .filter((field) => field.field_type === "dropdown")
      .forEach((field) => fetchFieldOptions(workspaceSlug.toString(), projectId.toString(), field.id));
  }, [workspaceSlug, projectId, customFields, fetchFieldOptions]);

  if (!customFields) {
    return (
      <div className="p-6">
        <Loader className="space-y-4">
          <Loader.Item height="120px" />
          <Loader.Item height="120px" />
        </Loader>
      </div>
    );
  }

  // Preserve each group's first-appearance order (matches the source column
  // order: 项目&合同基本信息, 项目基本类别, 项目状态) rather than sorting groups
  // alphabetically, which would scramble that.
  const groupOrder: string[] = [];
  const fieldsByGroup = new Map<string, typeof customFields>();
  for (const field of customFields) {
    const group = field.group_name ?? UNGROUPED_LABEL_KEY;
    if (!fieldsByGroup.has(group)) {
      groupOrder.push(group);
      fieldsByGroup.set(group, []);
    }
    fieldsByGroup.get(group)!.push(field);
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        {groupOrder.map((group) => (
          <section key={group}>
            <h2 className="mb-3 text-body-sm-medium text-secondary">
              {group === UNGROUPED_LABEL_KEY ? t(UNGROUPED_LABEL_KEY) : group}
            </h2>
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-sm border border-subtle p-4 sm:grid-cols-2">
              {fieldsByGroup.get(group)!.map((field) => (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <label className="truncate text-body-xs-medium text-tertiary">{field.name}</label>
                  <ProjectCustomFieldValueInput
                    field={field}
                    value={getFieldValue(field.id)}
                    options={getFieldOptions(field.id)}
                    projectId={projectId!.toString()}
                    // Not permission-gated further here: the project_info nav item
                    // itself is already ADMIN+MEMBER-only (use-navigation-items.ts),
                    // the same level Settings > Custom Fields uses for value edits.
                    disabled={false}
                    onSave={(data) =>
                      setCustomFieldValue(workspaceSlug!.toString(), projectId!.toString(), field.id, data)
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
});
