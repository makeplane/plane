/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useIssueCoverImage } from "@/hooks/use-issue-cover-image";

interface KanbanIssueCoverImageProps {
  issueId: string;
  projectId: string | null;
  coverImageAttachmentId?: string | null;
}

export const KanbanIssueCoverImage = observer(function KanbanIssueCoverImage(props: KanbanIssueCoverImageProps) {
  const { issueId, projectId, coverImageAttachmentId } = props;
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
    <div className="relative h-32 w-full overflow-hidden">
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
