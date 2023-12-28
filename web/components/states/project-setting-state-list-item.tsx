import { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication, useProjectState } from "hooks/store";
// ui
import { Tooltip, StateGroupIcon } from "@plane/ui";
// icons
import { Pencil, X, ArrowDown, ArrowUp } from "lucide-react";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { IState } from "@plane/types";

type Props = {
  index: number;
  state: IState;
  statesList: IState[];
  handleEditState: () => void;
  handleDeleteState: () => void;
};

export const StatesListItem: React.FC<Props> = observer((props) => {
  const { index, state, statesList, handleEditState, handleDeleteState } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const {
    eventTracker: { setTrackElement },
  } = useApplication();
  const { markStateAsDefault, moveStatePosition } = useProjectState();
  // derived values
  const groupStates = statesList.filter((s) => s.group === state.group);
  const groupLength = groupStates.length;

  const handleMakeDefault = () => {
    if (!workspaceSlug || !projectId) return;
    setIsSubmitting(true);
    markStateAsDefault(workspaceSlug.toString(), projectId.toString(), state.id).finally(() => {
      setIsSubmitting(false);
    });
  };

  const handleMove = (state: IState, direction: "up" | "down") => {
    if (!workspaceSlug || !projectId) return;
    moveStatePosition(workspaceSlug.toString(), projectId.toString(), state.id, direction, index);
  };

  return (
    <div className="group flex items-center justify-between gap-2 rounded border-[0.5px] border-custom-border-200 bg-custom-background-100 px-4 py-3">
      <div className="flex items-center gap-3">
        <StateGroupIcon stateGroup={state.group} color={state.color} height="16px" width="16px" />
        <div>
          <h6 className="text-sm font-medium">{addSpaceIfCamelCase(state.name)}</h6>
          <p className="text-xs text-custom-text-200">{state.description}</p>
        </div>
      </div>
      <div className="group flex items-center gap-2.5">
        {index !== 0 && (
          <button
            type="button"
            className="hidden text-custom-text-200 group-hover:inline-block"
            onClick={() => handleMove(state, "up")}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
        {!(index === groupLength - 1) && (
          <button
            type="button"
            className="hidden text-custom-text-200 group-hover:inline-block"
            onClick={() => handleMove(state, "down")}
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        )}

        <div className=" hidden items-center gap-2.5 group-hover:flex">
          {state.default ? (
            <span className="text-xs text-custom-text-200">Default</span>
          ) : (
            <button
              type="button"
              className="hidden text-xs text-custom-sidebar-text-400 group-hover:inline-block"
              onClick={handleMakeDefault}
              disabled={isSubmitting}
            >
              Mark as default
            </button>
          )}
          <button
            type="button"
            className="grid place-items-center opacity-0 group-hover:opacity-100"
            onClick={handleEditState}
          >
            <Pencil className="h-3.5 w-3.5 text-custom-text-200" />
          </button>

          <button
            type="button"
            className={`opacity-0 group-hover:opacity-100 ${
              state.default || groupLength === 1 ? "cursor-not-allowed" : ""
            } grid place-items-center`}
            onClick={() => {
              setTrackElement("PROJECT_SETTINGS_STATE_PAGE");
              handleDeleteState();
            }}
            disabled={state.default || groupLength === 1}
          >
            {state.default ? (
              <Tooltip tooltipContent="Cannot delete the default state.">
                <X className={`h-4 w-4 ${groupLength < 1 ? "text-custom-sidebar-text-400" : "text-red-500"}`} />
              </Tooltip>
            ) : groupLength === 1 ? (
              <Tooltip tooltipContent="Cannot have an empty group.">
                <X className={`h-4 w-4 ${groupLength < 1 ? "text-custom-sidebar-text-400" : "text-red-500"}`} />
              </Tooltip>
            ) : (
              <X className={`h-4 w-4 ${groupLength < 1 ? "text-custom-sidebar-text-400" : "text-red-500"}`} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
