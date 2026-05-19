/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { useIssueCoverImage } from "@/hooks/use-issue-cover-image";

interface KanbanIssueCoverImageProps {
  issueId: string;
  projectId: string | null;
  attachmentCount: number;
  isEpic?: boolean;
}

export const KanbanIssueCoverImage = observer(function KanbanIssueCoverImage(props: KanbanIssueCoverImageProps) {
  const { issueId, projectId, attachmentCount, isEpic = false } = props;
  const { workspaceSlug } = useParams();
  const [imageLoadError, setImageLoadError] = useState(false);

  const serviceType: TIssueServiceType = isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES;
  const { coverImageUrl, isLoading } = useIssueCoverImage(
    workspaceSlug?.toString(),
    projectId,
    issueId,
    attachmentCount,
    serviceType
  );

  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: '128px', width: '100%', backgroundColor: '#f0f0f0' }} className="animate-pulse" />
    );
  }

  if (!coverImageUrl || imageLoadError) {
    return null;
  }

  return (
    <div style={{ position: 'relative', height: '128px', width: '100%', overflow: 'hidden' }}>
      <img
        src={coverImageUrl}
        alt="Cover"
        style={{ height: '100%', width: '100%', objectFit: 'cover' }}
        onError={() => setImageLoadError(true)}
        loading="lazy"
      />
    </div>
  );
});
