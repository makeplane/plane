/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { cn } from "@plane/utils";
import { useIssueCoverImage } from "@/hooks/use-issue-cover-image";

interface IssueDetailCoverImageProps {
  issueId: string;
  projectId: string | null;
  coverImageAttachmentId?: string | null;
  // Negative margins must cancel the parent container's horizontal padding so the
  // cover bleeds edge-to-edge. Defaults assume a px-8 container (peek overview);
  // pass a matching value for other paddings (e.g. px-9 on the browse view).
  layoutClassName?: string;
}

export const IssueDetailCoverImage = observer(function IssueDetailCoverImage(props: IssueDetailCoverImageProps) {
  const { issueId, projectId, coverImageAttachmentId, layoutClassName = "-mx-8 w-[calc(100%+4rem)]" } = props;
  const { workspaceSlug } = useParams();
  const [imageLoadError, setImageLoadError] = useState(false);

  const coverImageUrl = useIssueCoverImage(workspaceSlug?.toString(), projectId, issueId, coverImageAttachmentId);

  useEffect(() => {
    setImageLoadError(false);
  }, [coverImageUrl]);

  if (!coverImageUrl || imageLoadError) {
    return null;
  }

  return (
    <div className={cn("-mt-5 mb-4 h-60 overflow-hidden", layoutClassName)}>
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
