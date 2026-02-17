/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { PageHead } from "@/components/core/page-title";
import { StickiesInfinite } from "@/components/stickies/layout/stickies-infinite";

export default function WorkspaceStickiesPage() {
  return (
    <>
      <PageHead title="Your stickies" />
      <div className="relative h-full w-full overflow-hidden overflow-y-auto">
        <StickiesInfinite />
      </div>
    </>
  );
}
