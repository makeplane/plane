"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { IState } from "@plane/types";
// plane web components
import { StateFormSelection } from "@/plane-web/components/integrations/gitlab";
// plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types
import { E_STATE_MAP_KEYS, TStateMap, TStateMapKeys } from "@/plane-web/types/integrations/gitlab";

type TStateForm = {
  projectId: string | undefined;
  value: TStateMap;
  handleChange: <T extends keyof TStateMap>(key: T, value: TStateMap[T]) => void;
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

export const StateForm: FC<TStateForm> = observer((props) => {
  // props
  const { projectId, value, handleChange } = props;

  // hooks
  const { stateIdsByProjectId, getStateById } = useGitlabIntegration();
  const { t } = useTranslation();

  // derived values
  const planeProjectStates = ((projectId && stateIdsByProjectId(projectId)) || [])
    .map((id) => (projectId && getStateById(projectId, id)) || undefined)
    .filter((state) => state != undefined && state != null) as IState[];

  return (
    <div className="w-full min-h-44 max-h-full overflow-y-auto">
      {planeProjectStates &&
        projectId &&
        GIT_PR_DATA.map((gitState) => (
          <StateFormSelection
            title={t(`gitlab_integration.${gitState.key}`) || gitState.title}
            key={gitState.key}
            value={value?.[gitState.key]?.id || undefined}
            handleValue={(value: IState | undefined) => handleChange(gitState.key, value)}
            planeStates={planeProjectStates}
          />
        ))}
    </div>
  );
});
