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

interface IssueDetailCoverImageProps {
  issueId: string;
  projectId: string | null;
  attachmentCount: number;
  isEpic?: boolean;
}

export const IssueDetailCoverImage = observer(function IssueDetailCoverImage(props: IssueDetailCoverImageProps) {
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
      <div className="-mx-8 -mt-5 mb-4 h-60 w-[calc(100%+4rem)] animate-pulse bg-layer-1" />
    );
  }

  if (!coverImageUrl || imageLoadError) {
    return null;
  }

  return (
    <div className="-mx-8 -mt-5 mb-4 h-60 w-[calc(100%+4rem)] overflow-hidden">
      <img
        src={coverImageUrl}
        alt="Cover"
        className="h-full w-full object-cover"
        onError={() => setImageLoadError(true)}
        loading="lazy"
      />
    </div>
  );
});
