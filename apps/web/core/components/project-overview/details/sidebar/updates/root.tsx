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

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "@plane/propel/icons";
// plane package imports
import { E_SORT_ORDER } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
// components
import { ActivitySortRoot } from "@/components/issues/issue-detail/issue-activity";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectUpdates } from "@/plane-web/hooks/store/projects/use-project-updates";
// types
import type { TProjectUpdate } from "@/types";
// local imports
import { UpdateBlock } from "./block";
import { EmptyUpdates } from "./empty";
import { UpdatesLoader } from "./loader";
import { NewUpdate } from "./new-update";
import { useUpdates } from "./use-updates";

type ProjectUpdatesProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectUpdates = observer(function ProjectUpdates(props: ProjectUpdatesProps) {
  const { workspaceSlug, projectId } = props;
  // state
  const [showInput, setShowInput] = useState(false);
  const { storedValue: sortOrder, setValue: setSortOrder } = useLocalStorage<E_SORT_ORDER>(
    "project_overview_updates_sort_order",
    E_SORT_ORDER.ASC
  );
  // hooks
  const { permissions: projectPermissions } = useProject();
  const { getUpdatesByProjectId, loader } = useProjectUpdates();
  const { handleUpdateOperations } = useUpdates(workspaceSlug.toString(), projectId.toString());

  // handler
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC);
  };

  // derived
  const projectUpdates = getUpdatesByProjectId(projectId.toString()) ?? [];
  const projectUpdatePermissions = projectPermissions.getUpdatePermissions(
    workspaceSlug.toString(),
    projectId.toString()
  );

  const getUpdateBlockPermissions = (updateId: string) => {
    const commentPermissions = projectUpdatePermissions.getCommentPermissions(updateId);
    return {
      updates: {
        canReact: projectUpdatePermissions.getCanReact(updateId),
        canEdit: projectUpdatePermissions.getCanEdit(updateId),
        canDelete: projectUpdatePermissions.getCanDelete(updateId),
      },
      comments: {
        canCreate: commentPermissions.canCreate,
        canUpdate: (commentId: string) => commentPermissions.getCanEdit(commentId),
        canDelete: (commentId: string) => commentPermissions.getCanDelete(commentId),
        canReact: (commentId: string) => commentPermissions.getCanReact(commentId),
      },
    };
  };

  const handleNewUpdate = async (data: Partial<TProjectUpdate>) => {
    try {
      await handleUpdateOperations.create(data);
      setShowInput(false);
    } catch (error) {
      console.error("error", error);
    }
  };

  const sortedProjectUpdates = useMemo(
    () => (sortOrder === E_SORT_ORDER.ASC ? [...projectUpdates].reverse() : projectUpdates),
    [sortOrder, projectUpdates]
  );

  return loader ? (
    <UpdatesLoader />
  ) : (
    <>
      {/* New Update */}
      {showInput && <NewUpdate handleClose={() => setShowInput(false)} handleCreate={handleNewUpdate} />}

      {/* No Updates */}
      {!showInput && projectUpdates.length === 0 && (
        <EmptyUpdates canCreate={projectUpdatePermissions.canCreate} handleNewUpdate={() => setShowInput(true)} />
      )}

      {/* Add update */}
      {!showInput && projectUpdates.length !== 0 && (
        <div className="flex justify-between h-7 items-center">
          <button
            className="flex text-accent-primary text-13 font-medium rounded-sm w-fit py-1 px-2"
            onClick={() => setShowInput(true)}
            disabled={!projectUpdatePermissions.canCreate}
          >
            <PlusIcon width={15} height={15} className="my-auto mr-1" />
            <div>Add update</div>
          </button>
          <ActivitySortRoot sortOrder={sortOrder ?? E_SORT_ORDER.ASC} toggleSort={toggleSortOrder} />
        </div>
      )}

      {/* Updates */}
      {sortedProjectUpdates.length > 0 && (
        <div className="flex flex-col gap-4 pt-3 pb-20">
          {sortedProjectUpdates.map((updateId) => (
            <UpdateBlock
              updateId={updateId}
              key={updateId}
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              handleUpdateOperations={handleUpdateOperations}
              permissions={getUpdateBlockPermissions(updateId)}
            />
          ))}
        </div>
      )}
    </>
  );
});
