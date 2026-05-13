/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
// components
import { PageHead } from "@/components/core/page-title";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

function MessengerPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  // plane hooks
  // hooks
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} — Messenger`
    : "Messenger";

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="relative size-full">
        <iframe
          src="/messenger/index.html"
          title="Messenger"
          className="size-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </>
  );
}

export default observer(MessengerPage);
