import type { SetStateAction } from "react";
import { observer } from "mobx-react";
import { GripVertical } from "lucide-react";
import { EIconSize, STATE_TRACKER_ELEMENTS } from "@plane/constants";
// plane imports
import { EditIcon, StateGroupIcon } from "@plane/propel/icons";
import type { IState, TStateOperationsCallbacks } from "@plane/types";
// local imports
import { useProjectState } from "@/hooks/store/use-project-state";
import { StateDelete, StateMarksAsDefault } from "./options";

type TBaseStateItemTitleProps = {
  stateCount: number;
  state: IState;
  shouldShowDescription?: boolean;
  setUpdateStateModal: (value: SetStateAction<boolean>) => void;
};

type TEnabledStateItemTitleProps = TBaseStateItemTitleProps & {
  disabled: false;
  stateOperationsCallbacks: Pick<TStateOperationsCallbacks, "markStateAsDefault" | "deleteState">;
  shouldTrackEvents: boolean;
};

type TDisabledStateItemTitleProps = TBaseStateItemTitleProps & {
  disabled: true;
};

export type TStateItemTitleProps = TEnabledStateItemTitleProps | TDisabledStateItemTitleProps;

export const StateItemTitle = observer(function StateItemTitle(props: TStateItemTitleProps) {
  const { stateCount, setUpdateStateModal, disabled, state, shouldShowDescription = true } = props;
  // store hooks
  const { getStatePercentageInGroup } = useProjectState();
  // derived values
  const statePercentage = getStatePercentageInGroup(state.id);
  const percentage = statePercentage ? statePercentage / 100 : undefined;

  return (
    <div className="flex items-center gap-2 w-full justify-between">
      <div className="flex items-center gap-1 px-1">
        {/* draggable indicator */}
        {!disabled && stateCount != 1 && (
          <div className="flex-shrink-0 w-3 h-3 rounded-xs absolute -left-1.5 hidden group-hover:flex justify-center items-center transition-colors bg-surface-2 cursor-pointer text-secondary hover:text-primary">
            <GripVertical className="w-3 h-3" />
          </div>
        )}
        {/* state icon */}
        <div className="flex-shrink-0">
          <StateGroupIcon stateGroup={state.group} color={state.color} size={EIconSize.XL} percentage={percentage} />
        </div>
        {/* state title and description */}
        <div className="text-13 px-2 min-h-5">
          <h6 className="text-13 font-medium">{state.name}</h6>
          {shouldShowDescription && <p className="text-11 text-secondary">{state.description}</p>}
        </div>
      </div>
      {!disabled && (
        <div className="hidden group-hover:flex items-center gap-2">
          {/* state mark as default option */}
          <div className="flex-shrink-0 text-11 transition-all">
            <StateMarksAsDefault
              stateId={state.id}
              isDefault={state.default ? true : false}
              markStateAsDefaultCallback={props.stateOperationsCallbacks.markStateAsDefault}
            />
          </div>
          {/* state edit options */}
          <div className="flex items-center gap-1 transition-all">
            <button
              className="flex-shrink-0 w-5 h-5 rounded-sm flex justify-center items-center overflow-hidden transition-colors hover:bg-layer-1 cursor-pointer text-secondary hover:text-primary"
              onClick={() => setUpdateStateModal(true)}
              data-ph-element={STATE_TRACKER_ELEMENTS.STATE_LIST_EDIT_BUTTON}
            >
              <EditIcon className="w-3 h-3" />
            </button>
            <StateDelete
              totalStates={stateCount}
              state={state}
              deleteStateCallback={props.stateOperationsCallbacks.deleteState}
              shouldTrackEvents={props.shouldTrackEvents}
            />
          </div>
        </div>
      )}
    </div>
  );
});
