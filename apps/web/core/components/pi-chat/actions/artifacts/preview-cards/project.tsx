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
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ProjectIcon } from "@plane/propel/icons";
import { useProjectData } from "../useArtifactData";
import { WithPreviewHOC } from "./with-preview-hoc";

type TProps = {
  artifactId: string;
};

export const ProjectPreviewCard = observer(function ProjectPreviewCard(props: TProps) {
  const { artifactId } = props;
  const data = useProjectData(artifactId);
  if (!data) return <></>;
  return (
    <WithPreviewHOC artifactId={artifactId}>
      <div className="flex flex-col items-start gap-2">
        {/* header */}
        <div className="flex gap-2 items-center w-full">
          {/*  icon */}
          <div className="flex h-8  w-8 items-center justify-center rounded-md bg-layer-1">
            <span className="grid h-4 w-4 shrink-0 place-items-center">
              {data.logo_props ? (
                <Logo logo={data.logo_props} size={16} />
              ) : (
                <span className="grid h-4 w-4 shrink-0 place-items-center">
                  <ProjectIcon className="h-4 w-4" />
                </span>
              )}
            </span>
          </div>
          <div className="flex flex-col gap-1 items-start w-full overflow-hidden">
            <span className="text-body-sm-medium text-primary truncate text-start capitalize">
              {data.name || "Unknown"}
            </span>
          </div>
        </div>
      </div>
    </WithPreviewHOC>
  );
});
