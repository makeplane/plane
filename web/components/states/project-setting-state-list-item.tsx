import { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useEventTracker, useProjectState } from "hooks/store";
// ui
import { Tooltip, StateGroupIcon, CustomMenu } from "@plane/ui";
// icons
import { Pencil, X, ArrowDown, ArrowUp, MoreHorizontal, PenIcon, Trash2, Circle } from "lucide-react";
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
  const { setTrackElement } = useEventTracker();
  const { markStateAsDefault, moveStatePosition } = useProjectState();
  // derived values
  const groupStates = statesList.filter((s) => s.group === state.group);
  const groupLength = groupStates.length;

  const MenuItems = [
    {
      icon: (
        <svg width="13" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_555_4644)">
            <path
              d="M12.8334 6.99992C12.8334 3.77826 10.2217 1.16659 7.00002 1.16659C3.77836 1.16659 1.16669 3.77826 1.16669 6.99992C1.16669 10.2216 3.77836 12.8333 7.00002 12.8333C10.2217 12.8333 12.8334 10.2216 12.8334 6.99992Z"
              stroke="#60646C"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M10.5 7C10.5 5.067 8.933 3.5 7 3.5C5.067 3.5 3.5 5.067 3.5 7C3.5 8.933 5.067 10.5 7 10.5C8.933 10.5 10.5 8.933 10.5 7Z"
              stroke="#60646C"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_555_4644">
              <rect width="14" height="14" fill="white" />
            </clipPath>
          </defs>
        </svg>
      ),
      title: "Mark as default",
    },
    {
      icon: <PenIcon className="w-3 h-3 text-custom-text-300" />,
      title: "Edit state",
    },
    {
      icon: <Trash2 className="w-3 h-3 text-custom-text-300" />,
      title: "Delete state",
    },
  ];

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
      <div className="group hidden md:flex items-center gap-2.5">
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
      <div className="md:hidden flex items-center self-end gap-3">
        {state.default && <span className="text-xs text-custom-text-300">Default</span>}
        <CustomMenu
          maxHeight={"md"}
          placement="bottom-start"
          customButtonClassName="flex flex-grow justify-center text-custom-text-200 text-sm"
          closeOnSelect
          customButton={
            <span>
              <MoreHorizontal className="w-4 h-4 text-custom-text-300" />
            </span>
          }
        >
          {MenuItems.map((item, index) =>
            index === 0 && state.default ? (
              <></>
            ) : (
              <CustomMenu.MenuItem
                onClick={() => {
                  if (index === 0) handleMakeDefault();
                  if (index === 1) handleEditState();
                  if (index === 2) {
                    setTrackElement("PROJECT_SETTINGS_STATE_PAGE");
                    handleDeleteState();
                  }
                }}
                className="flex items-center gap-2"
              >
                {item.icon}
                <div className="text-custom-text-300">{item.title}</div>
              </CustomMenu.MenuItem>
            )
          )}
        </CustomMenu>
      </div>
    </div>
  );
});
