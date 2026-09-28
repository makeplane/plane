/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TDashboardTabError } from "../error-handling";

interface Props {
  title: string;
  error: TDashboardTabError;
  onRetry: () => void;
  testId: string;
}

/**
 * Shared error panel for the deep tabs (workload / projects /
 * timeline / insights). Surfaces an honest error message with a
 * retry CTA so QA can see what actually broke rather than a
 * fabricated "metric pending" placeholder.
 */
export function ErrorPanel({ title, error, onRetry, testId }: Props): React.ReactElement {
  const { message, ctaLabel } = describeError(error);
  return (
    <div className="flex flex-col gap-2 rounded-md border border-subtle bg-layer-1 p-4" data-testid={testId}>
      <p className="text-13 text-primary">{title}.</p>
      <p className="text-11 text-tertiary">{message}</p>
      {ctaLabel ? (
        <button
          type="button"
          onClick={onRetry}
          className="self-start rounded-sm border border-subtle bg-layer-2 px-3 py-1 text-12 text-secondary hover:bg-layer-3"
          data-testid={`${testId}-retry`}
        >
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
}

function describeError(error: TDashboardTabError): { message: string; ctaLabel: string | null } {
  switch (error.kind) {
    case "forbidden":
      return {
        message: "Your role doesn't have access to this view. Ask a workspace admin to grant the operations read role.",
        ctaLabel: "Retry",
      };
    case "unauthorized":
      return {
        message: "Your session expired. Sign in again to continue.",
        ctaLabel: "Retry",
      };
    case "not_found":
      return {
        message: "We couldn't find this resource. Refresh the page; if the problem persists, contact support.",
        ctaLabel: "Retry",
      };
    case "server_error":
      return {
        message: `The server returned ${error.status}. This is most likely a transient issue — try again in a moment.`,
        ctaLabel: "Retry",
      };
    case "network_error":
      return {
        message: "We couldn't reach the server. Check your connection and try again.",
        ctaLabel: "Retry",
      };
    case "aborted":
      return {
        message: "Request was cancelled.",
        ctaLabel: null,
      };
    case "malformed":
      return {
        message: `Unexpected response shape: ${error.message}`,
        ctaLabel: "Retry",
      };
  }
}
