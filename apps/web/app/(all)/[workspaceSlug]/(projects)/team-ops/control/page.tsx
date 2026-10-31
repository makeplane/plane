/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PageHead } from "@/components/core/page-title";
import { ControlRoot } from "@/components/team-ops/control";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

function ControlPage({ params }: Route.ComponentProps) {
  const { currentWorkspace } = useWorkspace();
  return (
    <>
      <PageHead title={currentWorkspace?.name ? `${currentWorkspace.name} - Control` : undefined} />
      <ControlRoot workspaceSlug={params.workspaceSlug} />
    </>
  );
}

export default observer(ControlPage);
