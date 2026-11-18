/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// the "Boards" section of Profile settings > Preferences.

import { observer } from "mobx-react";
// local imports
import { AutoCollapsePreferenceToggle } from "./auto-collapse-toggle";
import { GlobalBoardPreferenceToggle } from "./global-board-toggle";

export const BoardPreferencesList = observer(function BoardPreferencesList() {
  return (
    <div className="flex flex-col gap-y-1">
      <GlobalBoardPreferenceToggle />
      <AutoCollapsePreferenceToggle />
    </div>
  );
});
