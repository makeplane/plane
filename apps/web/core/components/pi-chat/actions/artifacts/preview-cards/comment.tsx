/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { WithPreviewHOC } from "./with-preview-hoc";
import { useTemplateData } from "../useArtifactData";
import { Hash } from "lucide-react";

type TProps = {
  artifactId: string;
};

export const CommentPreviewCard = observer(function CommentPreviewCard(props: TProps) {
  const { artifactId } = props;
  const data = useTemplateData(artifactId);
  const workitem = data?.issue_identifier;
  const comment = data?.parameters?.properties?.comment_html?.name;
  if (!data) return <></>;
  return (
    <WithPreviewHOC artifactId={data.artifact_id} shouldToggleSidebar={false}>
      <div className="flex gap-2 items-start justify-between">
        <div className="flex gap-2 items-start">
          <div className="flex items-center justify-center my-1">
            <Hash className="size-4 text-primary" />
          </div>
          <div className="flex flex-wrap gap-1 truncate text-body-sm-regular text-start my-auto">
            {data.action === "create" ? "Adding" : "Deleting"} comment {comment && `"${comment}"`}
            {workitem && ` ${data.action === "create" ? "to" : "from"} ${workitem}`}
          </div>
        </div>
      </div>
    </WithPreviewHOC>
  );
});
