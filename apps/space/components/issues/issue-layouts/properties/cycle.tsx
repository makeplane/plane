/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { CycleSelect } from "@plane/blocks/property-select";
import type { CycleOption } from "@plane/blocks/property-select";
import type { SelectVariant } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import type { TCycleGroups } from "@plane/types";
import { cn } from "@plane/utils";
// helpers
import { READ_ONLY_SELECT_CLASSNAME, toSinglePage } from "@/helpers/select.helper";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
// types
import type { TPublicCycle } from "@/types/cycle";

const CYCLE_GROUPS: TCycleGroups[] = ["current", "upcoming", "completed", "draft"];

type Props = {
  cycleId: string | undefined;
  variant?: SelectVariant;
  className?: string;
};

const toCycleOption = (cycle: TPublicCycle): CycleOption => {
  const status = cycle.status?.toLowerCase();
  return {
    id: cycle.id,
    name: cycle.name,
    status: CYCLE_GROUPS.find((group) => group === status),
  };
};

/** The work item cycle as a read-only `CycleSelect` chip. */
export const IssueBlockCycle = observer(function IssueBlockCycle(props: Props) {
  const { cycleId, variant = "pill-md", className } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { cycles, getCycleById } = useCycle();
  // derived values
  const cycle = getCycleById(cycleId);

  return (
    <CycleSelect
      getValues={() => toSinglePage(cycles?.map(toCycleOption))}
      value={cycle ? toCycleOption(cycle) : null}
      onChange={() => {}}
      variant={variant}
      placeholder={t("common.cycle")}
      className={cn(READ_ONLY_SELECT_CLASSNAME, className)}
      tooltip={{ heading: t("common.cycle"), emptyContent: t("common.none") }}
      clearable={false}
      disabled
    />
  );
});
