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
    // TODO-@plane/propel/pill: replace once pill component is ready at propel
    <div className="flex items-center gap-1 bg-layer-2 border border-subtle rounded-md p-1 ">
      <StateGroupIcon stateGroup={state?.group ?? "backlog"} className="size-3.5 shrink-0" />
      <span className="text-caption-sm-regular text-tertiary">{state?.name ?? t("common.state")}</span>
    </div>
  );
});
