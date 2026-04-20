/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { SetStateAction } from "react";
import { observer } from "mobx-react";
import { GripVertical } from "lucide-react";
import { EIconSize } from "@plane/constants";
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
  canEdit: boolean;
  canDragAndDrop: boolean;
};

type TMarkAsDefaultStateItemTitleProps =
  | {
      canMarkAsDefault: true;
      markStateAsDefaultCallback: TStateOperationsCallbacks["markStateAsDefault"];
    }
  | {
      canMarkAsDefault: false;
    };

type TDeleteStateItemTitleProps =
  | {
      canDelete: true;
      deleteStateCallback: TStateOperationsCallbacks["deleteState"];
    }
  | {
      canDelete: false;
    };

export type TStateItemTitleProps = TBaseStateItemTitleProps &
  TMarkAsDefaultStateItemTitleProps &
  TDeleteStateItemTitleProps;

export const StateItemTitle = observer(function StateItemTitle(props: TStateItemTitleProps) {
  const {
    canDelete,
    canEdit,
    canMarkAsDefault,
    canDragAndDrop,
    setUpdateStateModal,
    shouldShowDescription = true,
    state,
    stateCount,
  } = props;
  // store hooks
  const { getStatePercentageInGroup } = useProjectState();
  // derived values
  const statePercentage = getStatePercentageInGroup(state.id);
  const percentage = statePercentage ? statePercentage / 100 : undefined;

  return (
    <div className="flex items-center gap-2 w-full justify-between">
      <div className="flex items-center gap-1 px-1">
        {/* draggable indicator */}
        {canDragAndDrop && stateCount != 1 && (
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
      <div className="hidden group-hover:flex items-center gap-2">
        {/* state mark as default option */}
        {canMarkAsDefault && (
          <div className="flex-shrink-0 text-11 transition-all">
            <StateMarksAsDefault
              stateId={state.id}
              isDefault={state.default ? true : false}
              markStateAsDefaultCallback={props.markStateAsDefaultCallback}
            />
          </div>
        )}
        {/* state edit options */}
        <div className="flex items-center gap-1 transition-all">
          {canEdit && (
            <button
              className="flex-shrink-0 w-5 h-5 rounded-sm flex justify-center items-center overflow-hidden transition-colors hover:bg-layer-1 cursor-pointer text-secondary hover:text-primary"
              onClick={() => setUpdateStateModal(true)}
            >
              <EditIcon className="w-3 h-3" />
            </button>
          )}
          {canDelete && (
            <StateDelete totalStates={stateCount} state={state} deleteStateCallback={props.deleteStateCallback} />
          )}
        </div>
      </div>
    </div>
  );
});
