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
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { TrashIcon } from "@plane/propel/icons";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { EUserProjectRoles } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { BulkDeleteConfirmationModal } from "../modals/bulk-delete-modal";

type Props = {
  handleClearSelection: () => void;
  selectedIssueIds: string[];
};

export const BulkDeleteIssues = observer(function BulkDeleteIssues(props: Props) {
  const { handleClearSelection, selectedIssueIds } = props;
  // states
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  // store hooks
  const { projectId, workspaceSlug } = useParams();
  const { allowPermissions } = useUserPermissions();

  // derived values

  const canPerformProjectAdminActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);

  return (
    <>
      {projectId && workspaceSlug && (
        <BulkDeleteConfirmationModal
          isOpen={isBulkDeleteModalOpen}
          handleClose={() => setIsBulkDeleteModalOpen(false)}
          issueIds={selectedIssueIds}
          onSubmit={handleClearSelection}
          projectId={projectId.toString()}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      <Tooltip
        tooltipHeading="Delete"
        tooltipContent={canPerformProjectAdminActions ? "" : "You don't have permission to perform this action."}
      >
        <button
          type="button"
          className={cn("outline-none grid place-items-center", {
            "cursor-not-allowed text-placeholder": !canPerformProjectAdminActions,
          })}
          onClick={() =>
            canPerformProjectAdminActions
              ? setIsBulkDeleteModalOpen(true)
              : setToast({
                  type: TOAST_TYPE.ERROR,
                  title: "You don't have permission to perform this action.",
                })
          }
        >
          <TrashIcon className="size-4" />
        </button>
      </Tooltip>
    </>
  );
});
