/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { PlaneLogo } from "@plane/propel/icons";

// Hangar "H" monogram with a subtle pulse, used as the app splash/loading mark.
// currentColor (text-primary) keeps it theme-aware without separate light/dark assets.
export function LogoSpinner() {
  return (
    <div className="flex items-center justify-center">
      <PlaneLogo className="h-6 w-auto animate-pulse text-primary sm:h-11" />
    </div>
  );
}
