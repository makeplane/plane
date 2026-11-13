/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core/page-title";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import { WorkspaceBoardRoot } from "@/components/issues/issue-layouts/kanban/roots/workspace-board-root";

function WorkspaceBoardPage() {
  // store
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Board` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <WorkspaceBoardRoot />
    </>
  );
}

export default observer(WorkspaceBoardPage);
