/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import { normalizeIssuePropertyValuesForApi } from "@/plane-web/helpers/issue-type-property-values";
import { observer } from "mobx-react";
import type { UseFormWatch } from "react-hook-form";
import { DEFAULT_WORK_ITEM_FORM_VALUES } from "@plane/constants";
import type { ISearchIssueResponse, TIssue } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import { IssueModalContext } from "@/components/issues/issue-modal/context";
import type { TIssueFields } from "@/plane-web/components/issues/issue-modal/issue-type-select";
import type { TIssuePropertyValueErrors, TIssuePropertyValues } from "@/plane-web/types/issue-types";
import { useUser } from "@/hooks/store/user/user-user";
import { WorkItemTemplateService } from "@/services/work-item-template.service";
import { IssueTypeService } from "@/services/issue-type.service";

const workItemTemplateService = new WorkItemTemplateService();
const issueTypeService = new IssueTypeService();

export type TIssueModalProviderProps = {
  templateId?: string;
  dataForPreload?: Partial<TIssue>;
  allowedProjectIds?: string[];
  children: React.ReactNode;
};

export const IssueModalProvider = observer(function IssueModalProvider(props: TIssueModalProviderProps) {
  const { children, allowedProjectIds } = props;
  const { t } = useTranslation();
  const [workItemTemplateId, setWorkItemTemplateId] = useState<string | null>(null);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);
  const [issuePropertyValues, setIssuePropertyValues] = useState<TIssuePropertyValues>({});
  const [issuePropertyValueErrors, setIssuePropertyValueErrors] = useState<TIssuePropertyValueErrors>({});
  const [mandatoryPropertyIds, setMandatoryPropertyIds] = useState<string[]>([]);
  const issuePropertyValuesRef = useRef<TIssuePropertyValues>(issuePropertyValues);
  issuePropertyValuesRef.current = issuePropertyValues;
  const projectDefaultTypeRef = useRef<Record<string, string | null>>({});
  const { projectsWithCreatePermissions } = useUser();
  const projectIdsWithCreatePermissions = Object.keys(projectsWithCreatePermissions ?? {});

  const handleTemplateChange = useCallback(
    async (propsArg: {
      workspaceSlug: string;
      projectId: string;
      templateId: string | null;
      reset: (values: Partial<TIssue>) => void;
      editorRef: React.MutableRefObject<import("@plane/editor").EditorRefApi | null>;
    }) => {
      const { workspaceSlug: slug, projectId, templateId, reset, editorRef } = propsArg;
      if (!templateId || !projectId) return;
      setIsApplyingTemplate(true);
      try {
        const data = await workItemTemplateService.retrieve(slug, templateId, projectId);
        const payload = data.resolved_payload ?? data.payload ?? {};
        const descriptionHtml =
          payload.description_html && payload.description_html !== "" ? String(payload.description_html) : "<p></p>";
        reset({
          ...DEFAULT_WORK_ITEM_FORM_VALUES,
          project_id: projectId,
          name: payload.name != null && String(payload.name) !== "" ? String(payload.name) : "",
          description_html: descriptionHtml,
          type_id: payload.type_id ?? null,
          state_id: payload.state_id ?? "",
          priority: payload.priority ?? "none",
          label_ids: Array.isArray(payload.label_ids) ? payload.label_ids : [],
          assignee_ids: Array.isArray(payload.assignee_ids) ? payload.assignee_ids : [],
          estimate_point: payload.estimate_point ?? null,
          cycle_id: payload.cycle_id ?? null,
          module_ids: Array.isArray(payload.module_ids) && payload.module_ids.length > 0 ? payload.module_ids : null,
          start_date: payload.start_date ?? null,
          target_date: payload.target_date ?? null,
          parent_id: null,
        });
        const applyEditor = () => editorRef.current?.setEditorValue?.(descriptionHtml, false);
        requestAnimationFrame(applyEditor);
        setTimeout(applyEditor, 0);
        setTimeout(applyEditor, 50);
      } catch (e) {
        console.error(e);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("work_item_templates.apply_failed_toast"),
        });
        setWorkItemTemplateId(null);
      } finally {
        setIsApplyingTemplate(false);
      }
    },
    [t]
  );

  const getIssueTypeIdOnProjectChange = useCallback((projectId: string) => {
    return projectDefaultTypeRef.current[projectId] ?? null;
  }, []);

  const handleProjectEntitiesFetch = useCallback(
    async (propsArg: { workItemProjectId?: string | null; workItemTypeId?: string; workspaceSlug: string }) => {
      const { workItemProjectId, workspaceSlug } = propsArg;
      if (!workItemProjectId || !workspaceSlug) return;
      try {
        const rows = await issueTypeService.listProjectTypes(workspaceSlug, workItemProjectId);
        const defaultRow = rows.find((row) => row.is_default) ?? rows[0];
        projectDefaultTypeRef.current[workItemProjectId] = defaultRow?.issue_type_id ?? null;
      } catch (e) {
        console.error(e);
      }
    },
    []
  );

  const getActiveAdditionalPropertiesLength = useCallback(
    (propsArg: { projectId: string | null; workspaceSlug: string; watch: UseFormWatch<TIssueFields> }) => {
      const typeId = propsArg.watch("type_id");
      if (!propsArg.projectId || !typeId) return 0;
      return Object.keys(issuePropertyValues).length;
    },
    [issuePropertyValues]
  );

  const handlePropertyValuesValidation = useCallback(
    (propsArg: { projectId: string | null; workspaceSlug: string; watch: UseFormWatch<TIssueFields> }) => {
      const typeId = propsArg.watch("type_id");
      if (!typeId || !propsArg.projectId || mandatoryPropertyIds.length === 0) {
        setIssuePropertyValueErrors({});
        return true;
      }
      const errors: TIssuePropertyValueErrors = {};
      for (const propertyId of mandatoryPropertyIds) {
        const value = issuePropertyValues[propertyId];
        if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
          errors[propertyId] = t("workspace_settings.settings.work_item_types.form.property.mandatory");
        }
      }
      setIssuePropertyValueErrors(errors);
      return Object.keys(errors).length === 0;
    },
    [issuePropertyValues, mandatoryPropertyIds, t]
  );

  const handleCreateUpdatePropertyValues = useCallback(
    async (propsArg: {
      issueId: string;
      projectId: string;
      workspaceSlug: string;
      issueTypeId?: string | null | undefined;
      values?: TIssuePropertyValues;
      isDraft?: boolean;
    }) => {
      const { issueId, projectId, workspaceSlug } = propsArg;
      const rawValues = propsArg.values ?? issuePropertyValuesRef.current;
      const values = normalizeIssuePropertyValuesForApi(rawValues).filter(
        (row) => row.value !== null && row.value !== undefined && row.value !== ""
      );
      if (!values.length) return;
      await issueTypeService.saveIssuePropertyValues(workspaceSlug, projectId, issueId, values);
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      allowedProjectIds: allowedProjectIds ?? projectIdsWithCreatePermissions,
      workItemTemplateId,
      setWorkItemTemplateId,
      isApplyingTemplate,
      setIsApplyingTemplate,
      selectedParentIssue,
      setSelectedParentIssue,
      issuePropertyValues,
      setIssuePropertyValues,
      issuePropertyValueErrors,
      setIssuePropertyValueErrors,
      mandatoryPropertyIds,
      setMandatoryPropertyIds,
      getIssueTypeIdOnProjectChange,
      getActiveAdditionalPropertiesLength,
      handlePropertyValuesValidation,
      handleCreateUpdatePropertyValues,
      handleProjectEntitiesFetch,
      handleTemplateChange,
      handleConvert: () => Promise.resolve(),
      handleCreateSubWorkItem: () => Promise.resolve(),
    }),
    [
      allowedProjectIds,
      projectIdsWithCreatePermissions,
      workItemTemplateId,
      isApplyingTemplate,
      selectedParentIssue,
      issuePropertyValues,
      issuePropertyValueErrors,
      mandatoryPropertyIds,
      getIssueTypeIdOnProjectChange,
      getActiveAdditionalPropertiesLength,
      handlePropertyValuesValidation,
      handleCreateUpdatePropertyValues,
      handleProjectEntitiesFetch,
      handleTemplateChange,
    ]
  );

  return <IssueModalContext.Provider value={contextValue}>{children}</IssueModalContext.Provider>;
});
