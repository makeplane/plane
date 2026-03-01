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

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import type { EIssuesStoreType, TIssue } from "@plane/types";
import { parseQueryParamsToFormData } from "@plane/utils";
// components
import { IssueModalProvider } from "@/components/issues/issue-modal/context/provider";
// plane web imports
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
import { useMember } from "@/hooks/store/use-member";
// local imports
import { CreateUpdateIssueModalBase } from "./base";

export interface IssuesModalProps {
  data?: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  beforeFormSubmit?: () => Promise<void>;
  onSubmit?: (res: TIssue) => Promise<void>;
  withDraftIssueWrapper?: boolean;
  storeType?: EIssuesStoreType;
  isDraft?: boolean;
  fetchIssueDetails?: boolean;
  moveToIssue?: boolean;
  modalTitle?: string;
  primaryButtonText?: {
    default: string;
    loading: string;
  };
  isProjectSelectionDisabled?: boolean;
  isTypeSelectDisabled?: boolean;
  templateId?: string;
  isConversionOperation?: boolean;
  allowedProjectIds?: string[];
  showActionItemsOnUpdate?: boolean;
}

export const CreateUpdateIssueModal = observer(function CreateUpdateIssueModal({ data, ...rest }: IssuesModalProps) {
  // router params
  const { cycleId, moduleId } = useParams();
  // store hooks
  const { workItemModalDataFromQueryParams } = useCommandPalette();
  const { getPartialProjectById } = useProject();
  const { data: currentUser, projectsWithCreatePermissions } = useUser();
  const { memberMap } = useMember();
  // derived values
  const dataFromQueryParams: Partial<TIssue> = useMemo(() => {
    const params = workItemModalDataFromQueryParams?.params;
    if (!currentUser || !params || Object.keys(params).length === 0) return {};
    const projectIdsWithCreatePermissions = Object.keys(projectsWithCreatePermissions ?? {});
    const projectsList = (rest.allowedProjectIds ?? projectIdsWithCreatePermissions).map((id) => ({
      id,
      identifier: getPartialProjectById(id)?.identifier ?? "",
    }));
    const usersList = Object.values(memberMap).map((member) => ({
      id: member.id,
      display_name: member.display_name,
    }));

    try {
      const parsedData = parseQueryParamsToFormData({
        queryParams: params,
        projects: projectsList,
        users: usersList,
        currentUserId: currentUser.id,
      });
      return parsedData;
    } catch {
      console.error("Failed to parse query params to form data in work item create modal");
      return {};
    }
  }, [
    currentUser,
    getPartialProjectById,
    memberMap,
    projectsWithCreatePermissions,
    rest.allowedProjectIds,
    workItemModalDataFromQueryParams,
  ]);
  const dataForPreload: Partial<TIssue> = useMemo(
    () => ({
      ...data,
      ...dataFromQueryParams,
      cycle_id: data?.cycle_id ? data?.cycle_id : cycleId ? cycleId.toString() : null,
      module_ids: data?.module_ids ? data?.module_ids : moduleId ? [moduleId.toString()] : null,
    }),
    [cycleId, data, dataFromQueryParams, moduleId]
  );

  if (!rest.isOpen) return null;

  return (
    <IssueModalProvider
      templateId={rest.templateId}
      dataForPreload={dataForPreload}
      allowedProjectIds={rest.allowedProjectIds}
    >
      <CreateUpdateIssueModalBase
        data={{
          ...data,
          ...dataFromQueryParams,
        }}
        {...rest}
      />
    </IssueModalProvider>
  );
});
