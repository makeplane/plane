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
import { StateFormSelection } from "@/components/integrations/gitlab";
// plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types

type TStateForm = {
  projectId: string | undefined;
  value: TStateMap;
  handleChange: <T extends keyof TStateMap>(key: T, value: TStateMap[T]) => void;
  isEnterprise: boolean;
};

const GIT_PR_DATA: { key: TStateMapKeys; title: string }[] = [
  {
    key: E_STATE_MAP_KEYS.DRAFT_MR_OPENED,
    title: "On draft PR open, set the state to",
  },
  {
    key: E_STATE_MAP_KEYS.MR_OPENED,
    title: "On PR open, set the state to",
  },
  {
    key: E_STATE_MAP_KEYS.MR_REVIEW_REQUESTED,
    title: "On PR review requested, set the state to",
  },
  {
    key: E_STATE_MAP_KEYS.MR_READY_FOR_MERGE,
    title: "On PR ready for merge, set the state to",
  },
  {
    key: E_STATE_MAP_KEYS.MR_MERGED,
    title: "On PR merged, set the state to",
  },
  {
    key: E_STATE_MAP_KEYS.MR_CLOSED,
    title: "On PR closed, set the state to",
  },
];

export const StateForm = observer(function StateForm(props: TStateForm) {
  // props
  const { projectId, value, handleChange, isEnterprise } = props;

  // hooks
  const { stateIdsByProjectId, getStateById } = useGitlabIntegration(isEnterprise);
  const { t } = useTranslation();

  // derived values
  const planeProjectStates = ((projectId && stateIdsByProjectId(projectId)) || [])
    .map((id) => (projectId && getStateById(projectId, id)) || undefined)
    .filter((state) => state != undefined && state != null);

  return (
    <div className="w-full min-h-44 max-h-full overflow-y-auto space-y-2">
      {planeProjectStates &&
        projectId &&
        GIT_PR_DATA.map((gitState) => (
          <StateFormSelection
            title={t(`gitlab_integration.${gitState.key}`) || gitState.title}
            key={gitState.key}
            value={value?.[gitState.key]?.id || undefined}
            handleValue={(value: IState | undefined) => handleChange(gitState.key, value)}
            planeStates={[EMPTY_PLANE_STATE, ...planeProjectStates]}
          />
        ))}
    </div>
  );
});
