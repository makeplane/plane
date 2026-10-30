/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { EmptyStateDetailed } from "@plane/blocks/empty-state";

export function SomethingWentWrongError() {
  return (
    <div className="grid min-h-screen w-full place-items-center bg-surface-1 p-6">
      <EmptyStateDetailed
        align="center"
        assetKey="server-error"
        assetClassName="size-40"
        title="Oops! Something went wrong."
        description="The public board does not exist. Please check the URL."
      />
    </div>
  );
}
