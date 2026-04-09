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
import { Link2 } from "lucide-react";

type TProps = {
  artifactId: string;
  isEditable: boolean;
};

export const LinkPreviewCard = observer(function LinkPreviewCard(props: TProps) {
  const { artifactId, isEditable } = props;
  const data = useTemplateData(artifactId);
  const link = data?.parameters?.properties;
  if (!data) return <></>;
  return (
    <WithPreviewHOC artifactId={data.artifact_id} shouldToggleSidebar={false} isEditable={isEditable}>
      <div className="flex gap-2 items-start justify-between w-full">
        <div className="flex gap-2 items-center truncate text-body-sm-medium text-start">
          <Link2 className="size-4 text-primary my-0.5 -rotate-45" />
          <a href={link?.url?.name} target="_blank">
            {link?.title?.name || link?.url?.name}
          </a>
        </div>
      </div>
    </WithPreviewHOC>
  );
});
