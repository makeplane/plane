/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { TDraggableData } from "@plane/constants";
import { STATE_GROUPS } from "@plane/constants";
import type { IState, IStateResponse, TStateGroups } from "@plane/types";

export const orderStateGroups = (unorderedStateGroups: IStateResponse | undefined): IStateResponse | undefined => {
  if (!unorderedStateGroups) return undefined;
  return Object.assign({ backlog: [], unstarted: [], started: [], completed: [], cancelled: [] }, unorderedStateGroups);
};

/**
 * d2m-plane: returns the state group keys in display order.
 * Uses the project's custom order when it is valid, falling back to the default STATE_GROUPS order.
 * Unknown keys are ignored and missing keys are appended in default order.
 */
export const getOrderedStateGroupKeys = (customOrder?: readonly string[] | null): TStateGroups[] => {
  const defaultOrder = Object.keys(STATE_GROUPS) as TStateGroups[];
  if (!customOrder || customOrder.length === 0) return defaultOrder;
  const ordered: TStateGroups[] = [];
  customOrder.forEach((key) => {
    if (key in STATE_GROUPS && !ordered.includes(key as TStateGroups)) ordered.push(key as TStateGroups);
  });
  defaultOrder.forEach((key) => {
    if (!ordered.includes(key)) ordered.push(key);
  });
  return ordered;
};

export const sortStates = (states: IState[], groupOrder?: readonly string[] | null) => {
  if (!states || states.length === 0) return;

  const orderedGroups: string[] = getOrderedStateGroupKeys(groupOrder);
  return states.sort((stateA, stateB) => {
    if (stateA.group === stateB.group) {
      return stateA.sequence - stateB.sequence;
    }
    return orderedGroups.indexOf(stateA.group) - orderedGroups.indexOf(stateB.group);
  });
};

export const getCurrentStateSequence = (
  groupSates: IState[],
  destinationData: TDraggableData,
  edge: string | undefined
) => {
  const defaultSequence = 65535;
  if (!edge) return defaultSequence;

  const currentStateIndex = groupSates.findIndex((state) => state.id === destinationData.id);
  const currentStateSequence = groupSates[currentStateIndex]?.sequence || undefined;

  if (!currentStateSequence) return defaultSequence;

  if (edge === "top") {
    const prevStateSequence = groupSates[currentStateIndex - 1]?.sequence || undefined;

    if (prevStateSequence === undefined) {
      return currentStateSequence - defaultSequence;
    }
    return (currentStateSequence + prevStateSequence) / 2;
  } else if (edge === "bottom") {
    const nextStateSequence = groupSates[currentStateIndex + 1]?.sequence || undefined;

    if (nextStateSequence === undefined) {
      return currentStateSequence + defaultSequence;
    }
    return (currentStateSequence + nextStateSequence) / 2;
  }
};
