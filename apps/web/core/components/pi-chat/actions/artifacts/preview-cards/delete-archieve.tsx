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
import { Hash } from "lucide-react";
import { useTemplateData } from "../useArtifactData";
import { WithPreviewHOC } from "./with-preview-hoc";

type TProps = {
  artifactId: string;
};

export const DeleteArchivePreviewCard = observer(function DeleteArchivePreviewCard(props: TProps) {
  const { artifactId } = props;
  const data = useTemplateData(artifactId);
  if (!data) return <></>;
  return (
    <WithPreviewHOC artifactId={data.artifact_id} shouldToggleSidebar={false}>
      <div className="flex gap-2 items-start justify-between">
        <div className="flex gap-2 items-center">
          <div className="flex items-center justify-center my-1">
            <Hash className="size-4 text-primary" />
          </div>
          <div className="truncate text-body-sm-medium text-start">
            <span className="text-body-sm-medium">{data.action === "delete" ? "Deleting " : "Archiving "}</span>{" "}
            {data.artifact_type}
            <span className="text-secondary">{data.parameters?.name}</span>{" "}
          </div>
        </div>
      </div>
    </WithPreviewHOC>
  );
});
