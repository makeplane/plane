/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

type Props = {
  processedAt: string | null;
  sentAt: string | null;
};

export const EmailLogStatusBadge = ({ processedAt, sentAt }: Props) => {
  if (sentAt)
    return <span className="rounded bg-success-subtle px-2 py-0.5 text-body-xs-medium text-success-primary">Sent</span>;
  if (processedAt)
    return (
      <span className="rounded bg-warning-subtle px-2 py-0.5 text-body-xs-medium text-warning-primary">Processed</span>
    );
  return <span className="rounded bg-surface-2 px-2 py-0.5 text-body-xs-medium text-secondary">Pending</span>;
};
