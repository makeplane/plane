/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";
import React from "react";

export function DropdownOptionsLoader() {
  return (
    <div className="flex flex-col gap-1 animate-pulse">
      {range(6).map((index) => (
        <div key={index} className="flex h-[1.925rem] w-full rounded-sm px-1 py-1.5 bg-surface-2" />
      ))}
    </div>
  );
}
