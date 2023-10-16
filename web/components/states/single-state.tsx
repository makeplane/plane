import { useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import { ProjectStateService } from "services/project";
// ui
import { Tooltip } from "@plane/ui";
// icons
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { StateGroupIcon } from "components/icons";
import { Pencil, X } from "lucide-react";

// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
import { groupBy, orderArrayBy } from "helpers/array.helper";
import { orderStateGroups } from "helpers/state.helper";
// types
import { IUser, IState } from "types";
// fetch-keys
import { STATES_LIST } from "constants/fetch-keys";

type Props = {
  index: number;
  state: IState;
  statesList: IState[];
  handleEditState: () => void;
  handleDeleteState: () => void;
  user: IUser | undefined;
};

// services
const projectStateService = new ProjectStateService();

export const SingleState: React.FC<Props> = ({
  index,
  state,
  statesList,
  handleEditState,
  handleDeleteState,
  user,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const groupStates = statesList.filter((s) => s.group === state.group);
  const groupLength = groupStates.length;

  const handleMakeDefault = () => {
    setIsSubmitting(true);

    const currentDefaultState = statesList.find((s) => s.default);

    let newStatesList = statesList.map((s) => ({
      ...s,
      default: s.id === state.id ? true : s.id === currentDefaultState?.id ? false : s.default,
    }));
    newStatesList = orderArrayBy(newStatesList, "sequence", "ascending");

    mutate(STATES_LIST(projectId as string), orderStateGroups(groupBy(newStatesList, "group")), false);

    if (currentDefaultState)
      projectStateService
        .patchState(
          workspaceSlug as string,
          projectId as string,
          currentDefaultState?.id ?? "",
          {
            default: false,
          },
          user
        )
        .then(() => {
          projectStateService
            .patchState(
              workspaceSlug as string,
              projectId as string,
              state.id,
              {
                default: true,
              },
              user
            )
            .then(() => {
              mutate(STATES_LIST(projectId as string));
              setIsSubmitting(false);
            })
            .catch(() => {
              setIsSubmitting(false);
            });
        });
    else
      projectStateService
        .patchState(
          workspaceSlug as string,
          projectId as string,
          state.id,
          {
            default: true,
          },
          user
        )
        .then(() => {
          mutate(STATES_LIST(projectId as string));
          setIsSubmitting(false);
        })
        .catch(() => {
          setIsSubmitting(false);
        });
  };

  const handleMove = (state: IState, direction: "up" | "down") => {
    let newSequence = 15000;

    if (direction === "up") {
      if (index === 1) newSequence = groupStates[0].sequence - 15000;
      else newSequence = (groupStates[index - 2].sequence + groupStates[index - 1].sequence) / 2;
    } else {
      if (index === groupLength - 2) newSequence = groupStates[groupLength - 1].sequence + 15000;
      else newSequence = (groupStates[index + 2].sequence + groupStates[index + 1].sequence) / 2;
    }

    let newStatesList = statesList.map((s) => ({
      ...s,
      sequence: s.id === state.id ? newSequence : s.sequence,
    }));
    newStatesList = orderArrayBy(newStatesList, "sequence", "ascending");

    mutate(STATES_LIST(projectId as string), orderStateGroups(groupBy(newStatesList, "group")), false);

    projectStateService
      .patchState(
        workspaceSlug as string,
        projectId as string,
        state.id,
        {
          sequence: newSequence,
        },
        user
      )
      .then((res) => {
        console.log(res);
        mutate(STATES_LIST(projectId as string));
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <div className="group flex items-center justify-between gap-2 rounded border border-custom-border-200 bg-custom-background-100 px-4 py-3">
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
            <ArrowUpIcon className="h-4 w-4" />
          </button>
        )}
        {!(index === groupLength - 1) && (
          <button
            type="button"
            className="hidden text-custom-text-200 group-hover:inline-block"
            onClick={() => handleMove(state, "down")}
          >
            <ArrowDownIcon className="h-4 w-4" />
          </button>
        )}

        <div className=" items-center gap-2.5 hidden group-hover:flex">
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
            className="grid place-items-center group-hover:opacity-100 opacity-0"
            onClick={handleEditState}
          >
            <Pencil className="h-3.5 w-3.5 text-custom-text-200" />
          </button>

          <button
            type="button"
            className={`group-hover:opacity-100 opacity-0 ${
              state.default || groupLength === 1 ? "cursor-not-allowed" : ""
            } grid place-items-center`}
            onClick={handleDeleteState}
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
};
