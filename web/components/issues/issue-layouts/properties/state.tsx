import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
// components
import { StateSelect } from "components/states";
// types
import { IState, IStateResponse } from "types";
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IIssuePropertyState {
  view: "profile" | "global" | "project";
  projectId: string | null;
  value: IState;
  onChange: (state: IState) => void;
  states: IState[] | null;
  disabled?: boolean;
  hideDropdownArrow?: boolean;
}

export const IssuePropertyState: React.FC<IIssuePropertyState> = observer((props) => {
  const { view, projectId, value, onChange, states, disabled, hideDropdownArrow = false } = props;

  const { workspace: workspaceStore, project: projectStore }: RootStore = useMobxStore();

  const workspaceSlug = workspaceStore?.workspaceSlug;

  const [options, setOptions] = useState<IState[]>([]);

  const fetchStates = async () => {
    if (projectId) {
      const projectStatusByGroup = projectStore?.states?.[projectId];

      const projectStates: IState[] = [];
      for (const group in projectStatusByGroup) projectStates.push(...projectStatusByGroup[group]);
      if (projectStates && projectStates.length > 0) setOptions(projectStates);
      else {
        workspaceSlug &&
          (await projectStore.fetchProjectStates(workspaceSlug, projectId).then((states: any) => {
            const projectStates: IState[] = [];
            for (const group in states) projectStates.push(...states[group]);
            if (projectStates && projectStates.length > 0) setOptions(projectStates);
          }));
      }
    }
  };

  return (
    <>
      {workspaceSlug && projectId && (
        <StateSelect
          value={value}
          onChange={onChange}
          states={states ?? undefined}
          buttonClassName="h-5"
          disabled={disabled}
          hideDropdownArrow={hideDropdownArrow}
        />
      )}
    </>
  );
});
