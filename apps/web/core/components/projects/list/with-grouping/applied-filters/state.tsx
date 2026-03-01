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

import { observer } from "mobx-react";
import { CloseIcon } from "@plane/propel/icons";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { ProjectStateIcon } from "@/components/workspace-project-states";
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import type { TProjectState } from "@/types/workspace-project-states";

type Props = {
  handleRemove: (val: string) => void;
  appliedFilters: string[];
  editable: boolean | undefined;
};

export const AppliedStateFilters = observer(function AppliedStateFilters(props: Props) {
  const { handleRemove, appliedFilters, editable } = props;

  const { getProjectStatesByWorkspaceId } = useWorkspaceProjectStates();

  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || undefined;
  const states = getProjectStatesByWorkspaceId(workspaceId ?? "") ?? ([] as TProjectState[]);

  return (
    <>
      {appliedFilters.map((state) => {
        const stateDetails = states.find((s) => s.id === state);
        if (!stateDetails) return null;
        return (
          <div key={state} className="flex items-center gap-1 rounded-sm px-1.5 py-1 text-11 bg-layer-1">
            <ProjectStateIcon projectStateGroup={stateDetails.group} width="14" height="14" />
            {stateDetails?.name}
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-tertiary hover:text-secondary"
                onClick={() => handleRemove(state)}
              >
                <CloseIcon height={10} width={10} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
});
