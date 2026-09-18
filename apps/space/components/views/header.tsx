/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { Link } from "react-router";
import { BrandMark } from "@/components/common/brand-mark";

export function AuthHeader() {
  return (
    <div className="sticky top-0 flex w-full flex-shrink-0 items-center justify-between gap-6">
      <Link to="/">
        <BrandMark className="h-5 text-primary" />
      </Link>
    </div>
  );
}
