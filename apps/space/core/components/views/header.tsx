/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import Link from "next/link";
import { PlaneLockup } from "@plane/propel/icons";

export function AuthHeader() {
  return (
    <div className="flex items-center justify-between gap-6 w-full flex-shrink-0 sticky top-0">
      <Link href="/">
        <PlaneLockup height={20} width={95} className="text-primary" />
      </Link>
    </div>
  );
}
