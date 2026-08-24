/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { Link } from "react-router";
import { InstanceBrandMark } from "@/components/brand/instance-brand-mark";

export function AuthHeader() {
  return (
    <div className="sticky top-0 flex w-full flex-shrink-0 items-center justify-between gap-6">
      <Link to="/">
        <InstanceBrandMark variant="lockup" className="h-5 w-auto text-primary" />
      </Link>
    </div>
  );
}
