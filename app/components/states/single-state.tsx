import { useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import stateService from "services/state.service";
// ui
import { Tooltip } from "components/ui";
// icons
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
import { groupBy, orderArrayBy } from "helpers/array.helper";
import { orderStateGroups } from "helpers/state.helper";
// types
import { IState } from "types";
// fetch-keys
import { STATE_LIST } from "constants/fetch-keys";
import { getStateGroupIcon } from "components/icons";

type Props = {
  index: number;
  state: IState;
  statesList: IState[];
  handleEditState: () => void;
  handleDeleteState: () => void;
};

export const SingleState: React.FC<Props> = ({
  index,
  state,
  statesList,
  handleEditState,
  handleDeleteState,
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

    mutate(
      STATE_LIST(projectId as string),
      orderStateGroups(groupBy(newStatesList, "group")),
      false
    );

    if (currentDefaultState)
      stateService
        .patchState(workspaceSlug as string, projectId as string, currentDefaultState?.id ?? "", {
          default: false,
        })
        .then(() => {
          stateService
            .patchState(workspaceSlug as string, projectId as string, state.id, {
              default: true,
            })
            .then(() => {
              mutate(STATE_LIST(projectId as string));
              setIsSubmitting(false);
            })
            .catch(() => {
              setIsSubmitting(false);
            });
        });
    else
      stateService
        .patchState(workspaceSlug as string, projectId as string, state.id, {
          default: true,
        })
        .then(() => {
          mutate(STATE_LIST(projectId as string));
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

    mutate(
      STATE_LIST(projectId as string),
      orderStateGroups(groupBy(newStatesList, "group")),
      false
    );

    stateService
      .patchState(workspaceSlug as string, projectId as string, state.id, {
        sequence: newSequence,
      })
      .then((res) => {
        console.log(res);
        mutate(STATE_LIST(projectId as string));
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <div
      className={`group flex items-center justify-between gap-2 border-brand-base bg-brand-surface-1 p-5 first:rounded-t-[10px] last:rounded-b-[10px]`}
    >
      <div className="flex items-center gap-3">
        {getStateGroupIcon(state.group, "20", "20", state.color)}
        <div>
          <h6 className="font-medium text-brand-muted-1">{addSpaceIfCamelCase(state.name)}</h6>
          <p className="text-xs text-gray-400">{state.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {index !== 0 && (
          <button
            type="button"
            className="hidden text-gray-400 hover:text-brand-base group-hover:inline-block"
            onClick={() => handleMove(state, "up")}
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
        )}
        {!(index === groupLength - 1) && (
          <button
            type="button"
            className="hidden text-gray-400 hover:text-brand-base group-hover:inline-block"
            onClick={() => handleMove(state, "down")}
          >
            <ArrowDownIcon className="h-4 w-4" />
          </button>
        )}
        {state.default ? (
          <span className="text-xs text-gray-400">Default</span>
        ) : (
          <button
            type="button"
            className="hidden text-xs text-gray-400 hover:text-brand-base group-hover:inline-block"
            onClick={handleMakeDefault}
            disabled={isSubmitting}
          >
            Set as default
          </button>
        )}

        <button type="button" className="grid place-items-center" onClick={handleEditState}>
          <PencilSquareIcon className="h-4 w-4 text-gray-400" />
        </button>
        <button
          type="button"
          className={`${
            state.default || groupLength === 1 ? "cursor-not-allowed" : ""
          } grid place-items-center`}
          onClick={handleDeleteState}
          disabled={state.default || groupLength === 1}
        >
          {state.default ? (
            <Tooltip tooltipContent="Cannot delete the default state.">
              <TrashIcon className="h-4 w-4 text-red-400" />
            </Tooltip>
          ) : groupLength === 1 ? (
            <Tooltip tooltipContent="Cannot have an empty group.">
              <TrashIcon className="h-4 w-4 text-red-400" />
            </Tooltip>
          ) : (
            <TrashIcon className="h-4 w-4 text-red-400" />
          )}
        </button>
      </div>
    </div>
  );
};
