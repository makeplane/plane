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
import { ProgramTimelineRoot } from "@/components/program-timeline/root";

function ProgramTimelinePage() {
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Program Timeline` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <ProgramTimelineRoot />
    </>
  );
}

export default observer(ProgramTimelinePage);
