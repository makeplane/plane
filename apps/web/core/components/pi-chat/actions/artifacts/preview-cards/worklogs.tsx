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

import { WithPreviewHOC } from "./with-preview-hoc";
import { observer } from "mobx-react";
import { useTemplateData } from "../useArtifactData";
import { Timer } from "lucide-react";

type TProps = {
  artifactId: string;
};

const getDuration = (duration: string) => {
  const minutes = parseInt(duration);
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hours ${minutes % 60} minutes`;
};
export const WorklogPreviewCard = observer(function WorklogPreviewCard(props: TProps) {
  const { artifactId } = props;
  const data = useTemplateData(artifactId);
  const worklog = data?.parameters?.properties;
  if (!data) return <></>;
  return (
    <WithPreviewHOC artifactId={artifactId}>
      <div className="flex gap-2 items-start justify-between">
        <div className="flex gap-2 items-start">
          <div className="flex items-center justify-center my-1">
            <Timer className="h-5 w-5 flex-shrink-0 text-tertiary" />
          </div>
          <div className="flex flex-wrap gap-1 truncate text-sm text-start my-auto">
            Logging {getDuration(worklog?.duration?.name || "0")}
          </div>
        </div>
      </div>
    </WithPreviewHOC>
  );
});
