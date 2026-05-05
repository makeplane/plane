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
    return <span className="text-success-primary bg-success-subtle px-2 py-0.5 rounded text-body-xs-medium">Sent</span>;
  if (processedAt)
    return (
      <span className="text-warning-primary bg-warning-subtle px-2 py-0.5 rounded text-body-xs-medium">Processed</span>
    );
  return <span className="text-secondary bg-surface-2 px-2 py-0.5 rounded text-body-xs-medium">Pending</span>;
};
