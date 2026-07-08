/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { ISearchIssueResponse, TIssue, TIssuePropertyValueErrors, TIssuePropertyValues } from "@plane/types";
// components
import { IssueModalContext } from "@/components/issues/issue-modal/context";
import type {
  TActiveAdditionalPropertiesProps,
  TCreateUpdatePropertyValuesProps,
  TPropertyValuesValidationProps,
} from "@/components/issues/issue-modal/context";
// hooks
import { useIssueProperty } from "@/hooks/store/use-issue-property";
import { useIssuePropertyValue } from "@/hooks/store/use-issue-property-value";
import { useIssueTypes } from "@/hooks/store/use-issue-types";
import { useUser } from "@/hooks/store/user/user-user";

export type TIssueModalProviderProps = {
  templateId?: string;
  dataForPreload?: Partial<TIssue>;
  allowedProjectIds?: string[];
  children: React.ReactNode;
};

export const IssueModalProvider = observer(function IssueModalProvider(props: TIssueModalProviderProps) {
  const { children, allowedProjectIds } = props;
  // states
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);
  const [issuePropertyValues, setIssuePropertyValues] = useState<TIssuePropertyValues>({});
  const [issuePropertyValueErrors, setIssuePropertyValueErrors] = useState<TIssuePropertyValueErrors>({});
  // store hooks
  const { projectsWithCreatePermissions } = useUser();
  const { getProjectDefaultIssueTypeId } = useIssueTypes();
  const { getTypeProperties } = useIssueProperty();
  const { setValue: setPropertyValue } = useIssuePropertyValue();
  // derived values
  const projectIdsWithCreatePermissions = Object.keys(projectsWithCreatePermissions ?? {});

  /**
   * Returns the project's default work item type id on project change.
   */
  const getIssueTypeIdOnProjectChange = (projectId: string): string | null =>
    getProjectDefaultIssueTypeId(projectId) ?? null;

  /**
   * Returns the number of active custom properties of the currently selected type.
   */
  const getActiveAdditionalPropertiesLength = (validationProps: TActiveAdditionalPropertiesProps): number => {
    const typeId = validationProps.watch("type_id");
    if (!typeId) return 0;
    return getTypeProperties(typeId, true)?.length ?? 0;
  };

  /**
   * Validates that every required active property of the current type has a value.
   * Sets the per-property errors and returns whether the values are valid.
   */
  const handlePropertyValuesValidation = (validationProps: TPropertyValuesValidationProps): boolean => {
    const typeId = validationProps.watch("type_id");
    if (!typeId) return true;
    const properties = getTypeProperties(typeId, true) ?? [];
    const errors: TIssuePropertyValueErrors = {};
    properties.forEach((property) => {
      if (!property.is_required) return;
      const values = issuePropertyValues[property.id] ?? [];
      const hasValue = values.some((value) => value !== undefined && value !== null && `${value}`.trim() !== "");
      if (!hasValue) errors[property.id] = "REQUIRED";
    });
    setIssuePropertyValueErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Persists the collected custom property values after a work item create/update.
   */
  const handleCreateUpdatePropertyValues = async (
    createUpdateProps: TCreateUpdatePropertyValuesProps
  ): Promise<void> => {
    const { issueId, projectId, workspaceSlug, issueTypeId } = createUpdateProps;
    if (!issueTypeId || !issueId || !projectId || !workspaceSlug) return;
    const properties = getTypeProperties(issueTypeId, true) ?? [];
    await Promise.all(
      properties.map((property) => {
        const values = issuePropertyValues[property.id];
        if (!values || values.length === 0) return Promise.resolve();
        return setPropertyValue(workspaceSlug, projectId, issueId, property.id, values).catch(() => {
          // Failures are surfaced by the work item toast; keep other values flowing.
        });
      })
    );
  };

  return (
    <IssueModalContext.Provider
      value={{
        allowedProjectIds: allowedProjectIds ?? projectIdsWithCreatePermissions,
        workItemTemplateId: null,
        setWorkItemTemplateId: () => {},
        isApplyingTemplate: false,
        setIsApplyingTemplate: () => {},
        selectedParentIssue,
        setSelectedParentIssue,
        issuePropertyValues,
        setIssuePropertyValues,
        issuePropertyValueErrors,
        setIssuePropertyValueErrors,
        getIssueTypeIdOnProjectChange,
        getActiveAdditionalPropertiesLength,
        handlePropertyValuesValidation,
        handleCreateUpdatePropertyValues,
        handleProjectEntitiesFetch: () => Promise.resolve(),
        handleTemplateChange: () => Promise.resolve(),
        handleConvert: () => Promise.resolve(),
        handleCreateSubWorkItem: () => Promise.resolve(),
      }}
    >
      {children}
    </IssueModalContext.Provider>
  );
});
