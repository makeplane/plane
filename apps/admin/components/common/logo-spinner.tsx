/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { BrandMark } from "./brand-mark";

export function LogoSpinner() {
  return (
    <div className="flex items-center justify-center">
      <BrandMark className="h-6 animate-pulse text-primary sm:h-11" />
    </div>
  );
}
