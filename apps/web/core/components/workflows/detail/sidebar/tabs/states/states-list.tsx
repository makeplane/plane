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

import { EIconSize } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { StateGroupIcon } from "@plane/propel/icons";
import type { IState } from "@plane/types";
import { cn } from "@plane/utils";
import { observer } from "mobx-react";

type Props = {
  states: IState[];
  selectedStates: string[];
  onChange: (stateId: string) => void;
  disabledStateIds: string[];
};

export const TransitionStatesList = observer(function TransitionStatesList(props: Props) {
  // props
  const { states, onChange, selectedStates, disabledStateIds } = props;

  return (
    <div className="flex flex-col">
      {states.map((state) => {
        const isDisabled = disabledStateIds.includes(state.id);
        return (
          <Button
            key={state.id}
            onClick={() => onChange(state.id)}
            variant={"ghost"}
            className={cn("justify-start gap-1 h-8", isDisabled ? "cursor-not-allowed" : "")}
            disabled={isDisabled}
          >
            <input type="radio" className="size-3" checked={selectedStates.includes(state.id)} disabled={isDisabled} />
            <StateGroupIcon stateGroup={state.group} color={state.color} size={EIconSize.LG} percentage={state.order} />
            <p className="text-body-sm-regular">{state.name}</p>
          </Button>
        );
      })}
    </div>
  );
});
