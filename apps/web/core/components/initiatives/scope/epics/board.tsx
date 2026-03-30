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
// components
import { BaseKanBanRoot } from "@/components/issues/issue-layouts/board/base-kanban-root";
// local imports
import { InitiativeScopeEpicQuickActions } from "./quick-actions";

type Props = {
  disabled?: boolean;
};

export const InitiativeScopeEpicBoard = observer(function InitiativeScopeEpicBoard({ disabled = false }: Props) {
  return (
    <BaseKanBanRoot
      QuickActions={InitiativeScopeEpicQuickActions}
      isEpic
      canEditPropertiesBasedOnProject={() => !disabled}
    />
  );
});
