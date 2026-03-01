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

import type { FC } from "react";
import { observer } from "mobx-react";
import { EMPTY_PLANE_STATE } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import type { IState, TStateMap, TStateMapKeys } from "@plane/types";
import { E_STATE_MAP_KEYS } from "@plane/types";
// plane web components
import { SelectProjectState } from "@/components/integrations/github/common";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store";
// plane web types

type TMapProjectPRState = {
  projectId: string | undefined;
  value: TStateMap;
  handleChange: <T extends keyof TStateMap>(key: T, value: TStateMap[T]) => void;
  isEnterprise: boolean;
};

const GIT_PR_DATA: { key: TStateMapKeys; title: string }[] = [
  {
    key: E_STATE_MAP_KEYS.DRAFT_MR_OPENED,
    title: "Draft Open",
  },
  {
    key: E_STATE_MAP_KEYS.MR_OPENED,
    title: "Open",
  },
  {
    key: E_STATE_MAP_KEYS.MR_REVIEW_REQUESTED,
    title: "Review Requested",
  },
  {
    key: E_STATE_MAP_KEYS.MR_READY_FOR_MERGE,
    title: "Ready for Merge",
  },
  {
    key: E_STATE_MAP_KEYS.MR_MERGED,
    title: "Merged",
  },
  {
    key: E_STATE_MAP_KEYS.MR_CLOSED,
    title: "Closed",
  },
];

export const MapProjectPRState = observer(function MapProjectPRState(props: TMapProjectPRState) {
  // props
  const { projectId, value, handleChange, isEnterprise } = props;

  const { t } = useTranslation();

  // hooks
  const { stateIdsByProjectId, getStateById } = useGithubIntegration(isEnterprise);

  // derived values
  const planeProjectStates = ((projectId && stateIdsByProjectId(projectId)) || [])
    .map((id) => (projectId && getStateById(projectId, id)) || undefined)
    .filter((state) => state != undefined && state != null);

  return (
    <div className="w-full min-h-44 max-h-full overflow-y-auto space-y-2">
      {planeProjectStates &&
        GIT_PR_DATA.map((gitState) => (
          <SelectProjectState
            title={t(`github_integration.${gitState.key}`) || gitState.title}
            key={gitState.key}
            value={value?.[gitState.key]?.id || undefined}
            handleValue={(value: IState | undefined) => handleChange(gitState.key, value)}
            planeStates={[EMPTY_PLANE_STATE, ...planeProjectStates]}
          />
        ))}
    </div>
  );
});
