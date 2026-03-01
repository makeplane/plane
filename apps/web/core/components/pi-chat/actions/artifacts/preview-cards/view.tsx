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
import { ViewsIcon } from "@plane/propel/icons";
import { useTemplateData } from "../useArtifactData";
import { Properties } from "./properties";
import { WithPreviewHOC } from "./with-preview-hoc";

type TProps = {
  artifactId: string;
};

export const ViewPreviewCard = observer(function ViewPreviewCard(props: TProps) {
  const { artifactId } = props;
  const data = useTemplateData(artifactId);
  const properties = { ...data?.parameters?.properties, project: data?.parameters?.project };
  if (!data) return <></>;
  return (
    <WithPreviewHOC artifactId={data.artifact_id}>
      <div className="flex gap-2 items-start">
        <ViewsIcon className="size-4 text-primary my-0.5" />
        <div className="flex flex-col">
          <div className="truncate text-body-sm-medium text-start capitalize">{data.parameters?.name || "Unknown"}</div>
          {properties && <Properties {...properties} />}
        </div>
      </div>
    </WithPreviewHOC>
  );
});
