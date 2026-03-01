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

export const AddRemovePreviewCard = observer(function AddRemovePreviewCard(props: TProps) {
  const { artifactId } = props;
  const data = useTemplateData(artifactId);
  const artifactSubType = data?.parameters?.artifact_sub_type;
  const properties = artifactSubType && data?.parameters?.properties[artifactSubType];
  if (!data) return <></>;

  return (
    <WithPreviewHOC artifactId={data.artifact_id} shouldToggleSidebar={false}>
      <div className="flex gap-2 items-start justify-between">
        <div className="flex gap-2 items-start">
          <div className="flex items-center justify-center my-1">
            <Hash className="size-4 text-primary" />
          </div>
          <div className="flex flex-wrap gap-1 truncate text-body-sm-medium text-start my-auto">
            <span className="text-body-sm-medium">{data.action === "add" ? "Adding " : "Removing "}</span>{" "}
            {data.artifact_type} <span className="text-primary text-body-sm-medium">{data.parameters?.name}</span>{" "}
            {data.action === "add" ? "to" : "from"} {artifactSubType}
            {properties && Array.isArray(properties) && properties.length > 0 ? "s" : ""}
            {properties &&
              Array.isArray(properties) &&
              properties.map(
                (
                  property: {
                    name: string;
                  },
                  index: number
                ) => (
                  <span key={property.name} className="text-primary text-body-sm-medium">
                    {property.name}
                    {index < properties.length - 1 ? ", " : ""}
                  </span>
                )
              )}
          </div>
        </div>
      </div>
    </WithPreviewHOC>
  );
});
