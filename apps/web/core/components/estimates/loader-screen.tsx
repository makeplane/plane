/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import { Loader } from "@plane/ui";

export function EstimateLoaderScreen() {
  return (
    <Loader className="mt-5 space-y-5">
      <Loader.Item height="40px" />
      <Loader.Item height="40px" />
      <Loader.Item height="40px" />
      <Loader.Item height="40px" />
    </Loader>
  );
}
