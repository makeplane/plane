"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
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
  optionsClassName?: string;
  labelIconSize?: string;
};
export const StateDropdown: FC<TStateDropdown> = observer((props) => {
  const {
    workspaceId,
    onChange,
    value,
    disabled,
    buttonClassName = "",
    className = "",
    optionsClassName = "",
    labelIconSize = "12",
  } = props;
  // hooks
  const { getProjectStateById, getProjectStateIdsWithGroupingByWorkspaceId } = useWorkspaceProjectStates();

  // derived values
  const selectedState = getProjectStateById(value);
  const dropdownLabel = () => (
    <Tooltip tooltipContent="State" position={"top"} className="ml-4">
      <div className="flex items-center gap-2 truncate max-w-[100px] ">
        {selectedState?.group && (
          <ProjectStateIcon
            projectStateGroup={selectedState?.group}
            color={selectedState?.color}
            width={labelIconSize}
            height={labelIconSize}
          />
        )}{" "}
        {selectedState ? (
          <span className="flex-grow truncate">{selectedState?.name}</span>
        ) : (
          <span className="flex-grow text-custom-text-350">None</span>
        )}
      </div>
    </Tooltip>
  );
  const groupedProjectStateIds = getProjectStateIdsWithGroupingByWorkspaceId(workspaceId);
  const dropdownOptions = (groupedProjectStateIds ? Object.values(groupedProjectStateIds).flat() : []).map(
    (stateId) => {
      const state = getProjectStateById(stateId);
      return {
        value: state?.id,
        query: `${state?.name} ${state?.group}`,
        content: (
          <div className="flex items-center gap-2 truncate">
            <ProjectStateIcon projectStateGroup={state?.group} color={state?.color} width="12" height="12" />{" "}
            <span className="flex-grow truncate max-w-[100px]">{state?.name}</span>
          </div>
        ),
      };
    }
  );

  return (
    <CustomSearchSelect
      value={value}
      onChange={onChange}
      options={dropdownOptions}
      label={dropdownLabel()}
      buttonClassName={buttonClassName}
      className={className}
      disabled={disabled}
      optionsClassName={optionsClassName}
      noChevron
    />
  );
});
