/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { CycleGroupIcon } from "@plane/blocks/icons";
import type { TCycleGroups } from "@plane/types";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { RemovableChip } from "@/components/common/removable-chip";
// ui
// types

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedCycleFilters = observer(function AppliedCycleFilters(props: Props) {
  const { handleRemove, values, editable } = props;
  // store hooks
  const { getCycleById } = useCycle();

  return (
    <>
      {values.map((cycleId) => {
        const cycleDetails = getCycleById(cycleId) ?? null;

        if (!cycleDetails) return null;

        const cycleStatus = (cycleDetails?.status ? cycleDetails?.status.toLocaleLowerCase() : "draft") as TCycleGroups;

        return (
          <RemovableChip
            key={cycleId}
            variant="soft"
            icon={<CycleGroupIcon cycleGroup={cycleStatus} className="h-3 w-3 flex-shrink-0" />}
            label={cycleDetails.name}
            ariaLabel={cycleDetails.name}
            onRemove={editable ? () => handleRemove(cycleId) : undefined}
          />
        );
      })}
    </>
  );
});
