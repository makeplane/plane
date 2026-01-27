/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Loader } from "@plane/ui";

export function FilterItemLoader() {
  return (
    <Loader>
      <Loader.Item height="28px" width="180px" />
    </Loader>
  );
}
