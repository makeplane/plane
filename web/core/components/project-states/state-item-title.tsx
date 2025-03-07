import { SetStateAction } from "react";
import { observer } from "mobx-react";
import { GripVertical, Pencil } from "lucide-react";
// plane imports
import { IState } from "@plane/types";
import { StateGroupIcon } from "@plane/ui";
// local imports
import { StateDelete, StateMarksAsDefault } from "./options";

export type StateItemTitleProps = {
  workspaceSlug: string;
  projectId: string;
  setUpdateStateModal: (value: SetStateAction<boolean>) => void;
  stateCount: number;
  disabled: boolean;
  state: IState;
  shouldShowDescription?: boolean;
};

export const StateItemTitle = observer((props: StateItemTitleProps) => {
  const {
    workspaceSlug,
    projectId,
    stateCount,
    setUpdateStateModal,
    disabled,
    state,
    shouldShowDescription = true,
  } = props;
  return (
    <div className="flex items-center gap-2 w-full justify-between">
      <div className="flex items-center gap-1 px-1">
        {/* draggable indicator */}
        {!disabled && stateCount != 1 && (
          <div className="flex-shrink-0 w-3 h-3 rounded-sm absolute -left-1.5 hidden group-hover:flex justify-center items-center transition-colors bg-custom-background-90 cursor-pointer text-custom-text-200 hover:text-custom-text-100">
            <GripVertical className="w-3 h-3" />
          </div>
        )}
        {/* state icon */}
        <div className="flex-shrink-0">
          <StateGroupIcon stateGroup={state.group} color={state.color} className={"size-3.5"} />
        </div>
        {/* state title and description */}
        <div className="text-sm px-2 min-h-5">
          <h6 className="text-sm font-medium">{state.name}</h6>
          {shouldShowDescription && <p className="text-xs text-custom-text-200">{state.description}</p>}
        </div>
      </div>

      {!disabled && (
        <div className="hidden group-hover:flex items-center gap-2">
          {/* state mark as default option */}
          <div className="flex-shrink-0 text-xs transition-all">
            <StateMarksAsDefault
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              stateId={state.id}
              isDefault={state.default ? true : false}
            />
          </div>

          {/* state edit options */}
          <div className="flex items-center gap-1 transition-all">
            <button
              className="flex-shrink-0 w-5 h-5 rounded flex justify-center items-center overflow-hidden transition-colors hover:bg-custom-background-80 cursor-pointer text-custom-text-200 hover:text-custom-text-100"
              onClick={() => setUpdateStateModal(true)}
            >
              <Pencil className="w-3 h-3" />
            </button>
            <StateDelete workspaceSlug={workspaceSlug} projectId={projectId} totalStates={stateCount} state={state} />
          </div>
        </div>
      )}
    </div>
  );
});
