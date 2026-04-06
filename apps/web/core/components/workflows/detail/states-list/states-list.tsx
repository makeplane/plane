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
import { Checkbox } from "@plane/ui";
import { observer } from "mobx-react";

type Props = {
  states: IState[];
  selectedStates: string[];
  onChange: (stateId: string) => void;
};

export const StatesSelectList = observer(function StatesSelectList(props: Props) {
  // props
  const { states, onChange, selectedStates } = props;

  return (
    <div className="flex flex-col">
      {states.map((state) => (
        <Button key={state.id} onClick={() => onChange(state.id)} variant={"ghost"} className="justify-start gap-1 h-8">
          <Checkbox className="size-4" checked={selectedStates.includes(state.id)} />
          <StateGroupIcon stateGroup={state.group} color={state.color} size={EIconSize.LG} percentage={state.order} />
          <p className="text-body-sm-regular">{state.name}</p>
        </Button>
      ))}
    </div>
  );
});
