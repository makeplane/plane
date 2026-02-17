/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// icons
// plane imports
import { EIconSize } from "@plane/constants";
import { CloseIcon, StateGroupIcon } from "@plane/propel/icons";
import type { IState } from "@plane/types";

type Props = {
  handleRemove: (val: string) => void;
  states: IState[];
  values: string[];
  editable: boolean | undefined;
};

export const AppliedStateFilters = observer(function AppliedStateFilters(props: Props) {
  const { handleRemove, states, values, editable } = props;

  return (
    <>
      {values.map((stateId) => {
        const stateDetails = states?.find((s) => s.id === stateId);

        if (!stateDetails) return null;

        return (
          <div key={stateId} className="flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <StateGroupIcon
              color={stateDetails.color}
              stateGroup={stateDetails.group}
              size={EIconSize.SM}
              percentage={stateDetails?.order}
            />
            {stateDetails.name}
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-tertiary hover:text-secondary"
                onClick={() => handleRemove(stateId)}
              >
                <CloseIcon height={10} width={10} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
});
