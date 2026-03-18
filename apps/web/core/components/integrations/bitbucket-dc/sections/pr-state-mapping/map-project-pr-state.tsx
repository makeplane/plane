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
import { EMPTY_PLANE_STATE } from "@plane/etl/core";
import type { IState, TStateMap, TStateMapKeys } from "@plane/types";
import { E_STATE_MAP_KEYS } from "@plane/types";
import { SelectProjectState } from "@/components/integrations/github/common";
import { useBitbucketDCIntegration } from "@/plane-web/hooks/store";

type TMapProjectPRState = {
  projectId: string | undefined;
  value: TStateMap;
  handleChange: <T extends keyof TStateMap>(key: T, value: TStateMap[T]) => void;
};

const BITBUCKET_PR_DATA: { key: TStateMapKeys; title: string }[] = [
  { key: E_STATE_MAP_KEYS.MR_OPENED, title: "Open" },
  { key: E_STATE_MAP_KEYS.MR_MERGED, title: "Merged" },
  { key: E_STATE_MAP_KEYS.MR_CLOSED, title: "Declined" },
];

export const MapProjectPRState = observer(function MapProjectPRState(props: TMapProjectPRState) {
  const { projectId, value, handleChange } = props;
  const { stateIdsByProjectId, getStateById } = useBitbucketDCIntegration();

  const planeProjectStates = ((projectId && stateIdsByProjectId(projectId)) || [])
    .map((id) => (projectId && getStateById(projectId, id)) || undefined)
    .filter((state): state is IState => state != null);

  return (
    <div className="w-full min-h-44 max-h-full overflow-y-auto space-y-2">
      {planeProjectStates &&
        BITBUCKET_PR_DATA.map((prState) => (
          <SelectProjectState
            title={prState.title}
            key={prState.key}
            value={value?.[prState.key]?.id || undefined}
            handleValue={(val: IState | undefined) => handleChange(prState.key, val)}
            planeStates={[EMPTY_PLANE_STATE, ...planeProjectStates]}
          />
        ))}
    </div>
  );
});
