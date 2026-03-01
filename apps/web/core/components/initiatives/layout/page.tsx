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
// local components
import { InitiativesRoot } from "../components/initiatives-root";
import InitiativesFiltersRow from "../components/rich-filters/row";
import { InitiativePeekOverview } from "../peek-overview";

export const InitiativesPageRoot = observer(function InitiativesPageRoot() {
  return (
    <div className="h-full w-full flex flex-col">
      <InitiativesFiltersRow />
      <InitiativesRoot />
      <InitiativePeekOverview />
    </div>
  );
});
