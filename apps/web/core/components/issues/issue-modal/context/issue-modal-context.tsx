/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { createContext } from "react";
// ce imports
import type { UseFormReset, UseFormWatch } from "react-hook-form";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { ISearchIssueResponse, TIssue, TIssuePropertyValues, TIssuePropertyValueErrors } from "@plane/types";
import type { TIssueFields } from "@/components/issues/issue-modal/properties/issue-type-select";

export type TPropertyValuesValidationProps = {
  projectId: string | null;
  workspaceSlug: string;
  watch: UseFormWatch<TIssueFields>;
};

export type TActiveAdditionalPropertiesProps = {
  projectId: string | null;
  workspaceSlug: string;
  watch: UseFormWatch<TIssueFields>;
};

export type TCreateUpdatePropertyValuesProps = {
  issueId: string;
  projectId: string;
  workspaceSlug: string;
  issueTypeId: string | null | undefined;
  isDraft?: boolean;
};

export type TCreateSubWorkItemProps = {
  workspaceSlug: string;
  projectId: string;
  parentId: string;
};

export type THandleTemplateChangeProps = {
  workspaceSlug: string;
  reset: UseFormReset<TIssue>;
  editorRef: React.MutableRefObject<EditorRefApi | null>;
};

export type THandleProjectEntitiesFetchProps = {
  workItemProjectId: string | null | undefined;
  workItemTypeId: string | undefined;
  workspaceSlug: string;
};

export type THandleParentWorkItemDetailsProps = {
  workspaceSlug: string;
  parentId: string | undefined;
  parentProjectId: string | undefined;
  isParentEpic: boolean;
};

export type TIssueModalContext = {
  allowedProjectIds: string[];
  workItemTemplateId: string | null;
  setWorkItemTemplateId: React.Dispatch<React.SetStateAction<string | null>>;
  isApplyingTemplate: boolean;
  setIsApplyingTemplate: React.Dispatch<React.SetStateAction<boolean>>;
  selectedParentIssue: ISearchIssueResponse | null;
  setSelectedParentIssue: React.Dispatch<React.SetStateAction<ISearchIssueResponse | null>>;
  issuePropertyValues: TIssuePropertyValues;
  setIssuePropertyValues: React.Dispatch<React.SetStateAction<TIssuePropertyValues>>;
  issuePropertyValueErrors: TIssuePropertyValueErrors;
  setIssuePropertyValueErrors: React.Dispatch<React.SetStateAction<TIssuePropertyValueErrors>>;
  getIssueTypeIdOnProjectChange: (projectId: string) => string | null;
  getActiveAdditionalPropertiesLength: (props: TActiveAdditionalPropertiesProps) => number;
  handlePropertyValuesValidation: (props: TPropertyValuesValidationProps) => boolean;
  handleCreateUpdatePropertyValues: (props: TCreateUpdatePropertyValuesProps) => Promise<void>;
  handleProjectEntitiesFetch: (props: THandleProjectEntitiesFetchProps) => Promise<void>;
  handleTemplateChange: (props: THandleTemplateChangeProps) => Promise<void>;
  handleConvert: (workspaceSlug: string, data: Partial<TIssue>) => Promise<void>;
  handleCreateSubWorkItem: (props: TCreateSubWorkItemProps) => Promise<void>;
};

export const IssueModalContext = createContext<TIssueModalContext | undefined>(undefined);
