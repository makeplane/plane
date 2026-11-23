/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// local imports
import { NotificationFilter } from "../../filters/menu";
import { NotificationHeaderMenuOption } from "./menu-option";

export const NotificationSidebarHeaderOptions = observer(function NotificationSidebarHeaderOptions() {
  return (
    <div className="relative flex h-8 items-center justify-center gap-2 text-body-xs-medium">
      {/* notification filters */}
      <NotificationFilter />

      {/* notification menu options */}
      <NotificationHeaderMenuOption />
    </div>
  );
});
