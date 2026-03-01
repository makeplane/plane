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

import type { FC } from "react";
import { observer } from "mobx-react";
import { StateGroupIcon } from "@plane/propel/icons";
import type { IState } from "@plane/types";
// plane web components
import { Dropdown } from "@/components/importers/ui";

type TMapStatesSelection = {
  value: string | undefined;
  handleValue: (value: string | undefined) => void;
  planeStates: IState[];
};

export const MapStatesSelection = observer(function MapStatesSelection(props: TMapStatesSelection) {
  const { value, handleValue, planeStates } = props;

  return (
    <Dropdown
      dropdownOptions={(planeStates || [])?.map((state) => ({
        key: state.id,
        label: state.name,
        value: state.id,
        data: state,
      }))}
      value={value}
      placeHolder="Select state"
      onChange={(value: string | undefined) => handleValue(value)}
      iconExtractor={(option) => (
        <div className="w-4.5 h-4.5 shrink-0 overflow-hidden relative flex justify-center items-center">
          <StateGroupIcon stateGroup={option?.group || "backlog"} />
        </div>
      )}
      queryExtractor={(option) => option.name}
    />
  );
});
