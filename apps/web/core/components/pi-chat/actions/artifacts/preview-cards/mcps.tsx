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
import { useTemplateData } from "../useArtifactData";
import { WithPreviewHOC } from "./with-preview-hoc";
import { EPillSize, EPillVariant, ERadius, Pill } from "@plane/propel/pill";

type TProps = {
  artifactId: string;
  isEditable: boolean;
};

export const McpsPreviewCard = observer(function McpsPreviewCard(props: TProps) {
  const { artifactId, isEditable } = props;
  const data = useTemplateData(artifactId);
  if (!data) return <></>;
  const parameters = data.parameters;
  return (
    <WithPreviewHOC
      artifactId={data.artifact_id}
      shouldToggleSidebar={false}
      showEdited={false}
      isEditable={isEditable}
    >
      <div className="flex gap-2 items-start justify-between w-full">
        <div className="flex gap-2 items-start w-full">
          <div className="flex flex-col w-full">
            <div className="flex gap-2 items-center justify-between">
              <div className="flex gap-2 items-center truncate text-body-sm-medium text-start">
                <div>Execute {parameters.mcp_name} tool </div>
                <Pill
                  variant={EPillVariant.PRIMARY}
                  size={EPillSize.SM}
                  radius={ERadius.SQUARE}
                  className="border-none "
                >
                  {parameters.tool_name}
                </Pill>
              </div>
              <div className="bg-layer-1 rounded-full py-0.5 px-2 capitalize text-caption-sm-regular text-secondary font-medium">
                MCP
              </div>
            </div>
          </div>
        </div>
      </div>
    </WithPreviewHOC>
  );
});
