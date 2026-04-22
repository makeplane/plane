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

import { useState } from "react";

import { PlusIcon } from "@plane/propel/icons";
import type { ISearchIssueResponse, TProjectIssuesSearchParams } from "@plane/types";
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
import milestoneService from "@/services/milestone.service";

type Props = {
  projectId: string;
  workspaceSlug: string;
  customButton?: React.ReactNode;
  handleSubmit: (data: ISearchIssueResponse[]) => Promise<void>;
  selectedWorkItemIds?: string[];
  milestoneId?: string;
  canAddWorkItems: boolean;
};
export function MilestoneWorkItemActionButton(props: Props) {
  const { projectId, workspaceSlug, customButton, handleSubmit, selectedWorkItemIds, milestoneId, canAddWorkItems } =
    props;

  const [workItemsModal, setWorkItemsModal] = useState<boolean>(false);

  if (!canAddWorkItems) return null;

  const workItemSearchCallBack = async (params: TProjectIssuesSearchParams) =>
    milestoneService.workItemsSearch(workspaceSlug, projectId, params);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setWorkItemsModal(true);
  };

  return (
    <>
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        isOpen={workItemsModal}
        handleClose={() => setWorkItemsModal(false)}
        searchParams={{ milestone_id: milestoneId }}
        selectedWorkItemIds={selectedWorkItemIds}
        handleOnSubmit={handleSubmit}
        workItemSearchServiceCallback={workItemSearchCallBack}
      />
      {customButton ? (
        <button type="button" className="appearance-none bg-transparent border-none p-0" onClick={handleClick}>
          {customButton}
        </button>
      ) : (
        <button type="button" className="appearance-none bg-transparent border-none p-0" onClick={handleClick}>
          <PlusIcon className="size-4 text-secondary cursor-pointer" />
        </button>
      )}
    </>
  );
}
