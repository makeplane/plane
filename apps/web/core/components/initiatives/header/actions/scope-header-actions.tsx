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
import { EIssueLayoutTypes } from "@plane/types";
import { LayoutSelection } from "@/components/issues/issue-layouts/filters";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  initiativeId: string;
};

export const InitiativeScopeHeaderActions = observer(function InitiativeScopeHeaderActions({ initiativeId }: Props) {
  const {
    initiative: {
      scope: { getDisplayFilters, updateDisplayFilters },
    },
  } = useInitiatives();

  const displayFilters = getDisplayFilters(initiativeId);

  const activeLayout = displayFilters?.activeLayout;

  // handle layout change
  const handleLayoutChange = (layout: EIssueLayoutTypes) => {
    updateDisplayFilters(initiativeId, { activeLayout: layout });
  };

  return (
    <div className="flex items-center gap-2">
      <LayoutSelection
        layouts={[EIssueLayoutTypes.LIST, EIssueLayoutTypes.GANTT]}
        onChange={(layout) => handleLayoutChange(layout)}
        selectedLayout={activeLayout}
      />
    </div>
  );
});
