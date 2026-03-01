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

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { StateGroupIcon } from "@plane/propel/icons";
// components
import { DropdownButton } from "@/components/dropdowns/buttons";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  stateId: string;
};

export const StatePill = observer(function StatePill(props: Props) {
  const { stateId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getStateById } = useProjectState();
  // derived state
  const state = getStateById(stateId);

  return (
    <DropdownButton
      className="h-4 w-fit pointer-events-none bg-surface-1"
      tooltipContent={state?.name ?? t("common.state")}
      variant={"border-with-text"}
      isActive={false}
      tooltipHeading={t("common.state")}
      showTooltip={false}
    >
      <StateGroupIcon
        stateGroup={state?.group ?? "backlog"}
        color={state?.color ?? "var(--text-color-tertiary)"}
        className="size-2 shrink-0"
      />
      <span className="grow truncate text-left text-11 text-secondary">{state?.name ?? t("common.state")}</span>
    </DropdownButton>
  );
});
