"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { IState, TStateGroups } from "@plane/types";
// components
import { StateList, StateCreate } from "@/components/project-states";
import { useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "ee/constants/user-permissions";

type TGroupItem = {
  workspaceSlug: string;
  projectId: string;
  groupKey: TStateGroups;
  groupedStates: Record<string, IState[]>;
  states: IState[];
};

export const GroupItem: FC<TGroupItem> = observer((props) => {
  const { workspaceSlug, projectId, groupKey, groupedStates, states } = props;
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // state
  const [createState, setCreateState] = useState(false);

  const isEditable = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="text-base font-medium text-custom-text-200 capitalize">{groupKey}</div>
        {isEditable && (
          <div
            className="flex-shrink-0 w-6 h-6 rounded flex justify-center items-center overflow-hidden transition-colors hover:bg-custom-background-80 cursor-pointer text-custom-primary-100/80 hover:text-custom-primary-100"
            onClick={() => !createState && setCreateState(true)}
          >
            <Plus className="w-4 h-4" />
          </div>
        )}
      </div>

      {isEditable && createState && (
        <StateCreate
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          groupKey={groupKey}
          handleClose={() => setCreateState(false)}
        />
      )}

      <div id="group-droppable-container">
        <StateList
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          groupKey={groupKey}
          groupedStates={groupedStates}
          states={states}
          disabled={!isEditable}
        />
      </div>
    </div>
  );
});
