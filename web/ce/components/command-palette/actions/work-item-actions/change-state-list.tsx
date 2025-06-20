import { Command } from "cmdk";
import { observer } from "mobx-react";
import { Check } from "lucide-react";
// plane imports
import { EIconSize } from "@plane/constants";
import { Spinner, StateGroupIcon } from "@plane/ui";
// store hooks
import { useProjectState } from "@/hooks/store";

export type TChangeWorkItemStateListProps = {
  projectId: string | null;
  currentStateId: string | null;
  handleStateChange: (stateId: string) => void;
};

export const ChangeWorkItemStateList = observer((props: TChangeWorkItemStateListProps) => {
  const { projectId, currentStateId, handleStateChange } = props;
  // store hooks
  const { getProjectStates } = useProjectState();
  // derived values
  const projectStates = getProjectStates(projectId);

  return (
    <>
      {projectStates ? (
        projectStates.length > 0 ? (
          projectStates.map((state) => (
            <Command.Item key={state.id} onSelect={() => handleStateChange(state.id)} className="focus:outline-none">
              <div className="flex items-center space-x-3">
                <StateGroupIcon
                  stateGroup={state.group}
                  color={state.color}
                  size={EIconSize.LG}
                  percentage={state?.order}
                />
                <p>{state.name}</p>
              </div>
              <div>{state.id === currentStateId && <Check className="h-3 w-3" />}</div>
            </Command.Item>
          ))
        ) : (
          <div className="text-center">No states found</div>
        )
      ) : (
        <Spinner />
      )}
    </>
  );
});
