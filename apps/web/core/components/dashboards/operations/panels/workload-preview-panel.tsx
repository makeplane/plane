/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TSectionStatus } from "@plane/types";
import { PanelSurface } from "./progress-panel";

interface Props {
  status: TSectionStatus;
  reason?: string;
  isLoading: boolean;
}

export function WorkloadPreviewPanel({ status, reason, isLoading }: Props): React.ReactElement {
  // Workload is intentionally a typed placeholder for now: backend
  // Task 3 owns the workload read model. Until the endpoint ships
  // the panel surfaces `status: "unavailable"` rather than a
  // fabricated roster.
  const isPending = status === "unavailable" || (reason && reason.includes("pending"));
  return (
    <PanelSurface
      title="Team workload"
      subtitle="5-person preview · sorted overdue → blocked → started."
      isLoading={isLoading && !isPending}
      error={status === "error"}
      testId="workload-preview-panel"
    >
      {isPending ? (
        <div className="flex flex-col gap-2 text-12 text-secondary" data-testid="workload-preview-pending">
          <p className="text-primary">Workload read model pending backend.</p>
          <p className="text-11 text-tertiary">
            The /dashboard/workload/ endpoint lands with backend Task 3. Until then the panel
            renders a typed unavailable state rather than fabricated counts.
          </p>
        </div>
      ) : status === "error" ? (
        <div className="text-12 text-danger">Failed to load workload preview.</div>
      ) : null}
    </PanelSurface>
  );
}