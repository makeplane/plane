/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { PageHead } from "@/components/core/page-title";

export default function WorkspaceSprintsPage() {
  return (
    <>
      <PageHead title="Squads" />
      <div className="flex h-full w-full items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-18 font-semibold text-primary">Select a squad</h2>
          <p className="mt-2 text-13 text-tertiary">
            Create or select a squad from the sidebar to manage open and archived sprints.
          </p>
        </div>
      </div>
    </>
  );
}
