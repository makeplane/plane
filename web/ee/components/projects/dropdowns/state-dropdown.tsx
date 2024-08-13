"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { CustomSearchSelect } from "@plane/ui";
// plane web hooks
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { ProjectStateIcon } from "../../workspace-project-states";

export type TStateDropdown = {
  workspaceSlug: string;
  workspaceId: string;
  onChange: (stateId: string) => void;
  buttonClassName?: string;
  className?: string;
  value: string;
  disabled: boolean;
};

export const StateDropdown: FC<TStateDropdown> = observer((props) => {
  const { workspaceId, onChange, value, disabled, buttonClassName = "", className = "" } = props;
  // hooks
  const { getProjectStateIdsByWorkspaceId, getProjectStateById } = useWorkspaceProjectStates();

  // derived values
  const projectStateIds = getProjectStateIdsByWorkspaceId(workspaceId);
  const selectedState = getProjectStateById(value);
  const dropdownLabel = () => (
    <div className="flex items-center gap-2 truncate">
      <ProjectStateIcon projectStateGroup={selectedState?.group} color={selectedState?.color} width="12" height="12" />{" "}
      <span className="flex-grow truncate">{selectedState?.name}</span>
    </div>
  );
  const dropdownOptions = (projectStateIds || []).map((stateId) => {
    const state = getProjectStateById(stateId);
    return {
      value: state?.id,
      query: `${state?.name} ${state?.group}`,
      content: (
        <div className="flex items-center gap-2 truncate">
          <ProjectStateIcon projectStateGroup={state?.group} color={state?.color} width="12" height="12" />{" "}
          <span className="flex-grow truncate">{state?.name}</span>
        </div>
      ),
    };
  });

  return (
    <CustomSearchSelect
      value={value}
      onChange={onChange}
      options={dropdownOptions}
      label={dropdownLabel()}
      buttonClassName={buttonClassName}
      className={className}
      disabled={disabled}
      noChevron
    />
  );
});
