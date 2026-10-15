/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane ui
import { CyclesOutline } from "@makeplane/propel/icons";
//hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { ReadOnlyProperty } from "./read-only-property";

type Props = {
  cycleId: string | undefined;
  shouldShowBorder?: boolean;
};

export const IssueBlockCycle = observer(function IssueBlockCycle({ cycleId, shouldShowBorder = true }: Props) {
  const { getCycleById } = useCycle();

  const cycle = getCycleById(cycleId);

  return (
    <ReadOnlyProperty
      icon={CyclesOutline}
      label={cycle?.name ?? "No Cycle"}
      tooltip={`Cycle: ${cycle?.name ?? "No Cycle"}`}
      shouldShowBorder={shouldShowBorder}
    />
  );
});
