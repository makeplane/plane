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

import { Accordion } from "@plane/propel/accordion";
import type { TArtifact } from "@/types";
import { PreviewCard } from "../preview-cards/root";

const artifactList = (artifacts: TArtifact[], isEditable: boolean) =>
  artifacts.map((artifact) => (
    <PreviewCard
      key={artifact.artifact_id}
      artifactId={artifact.artifact_id}
      type={artifact.artifact_type}
      action={artifact.action}
      isEditable={isEditable}
    />
  ));

export function PiChatArtifactsListRoot(props: { artifacts: TArtifact[]; isEditable: boolean }) {
  const { artifacts, isEditable } = props;

  if (artifacts.length > 5) {
    return (
      <Accordion.Root defaultValue={["artifacts"]} allowMultiple className="">
        <Accordion.Item value="artifacts">
          <Accordion.Trigger
            className="text-body-sm-medium text-primary group flex justify-start"
            icon={
              <div className="text-body-md-medium transition-all ease-out group-data-panel-open:rotate-90">&#9656;</div>
            }
          >
            {artifacts.length} actions
          </Accordion.Trigger>
          <Accordion.Content contentWrapperClassName="pt-0 flex flex-col gap-4">
            {artifactList(artifacts, isEditable)}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  }

  return artifactList(artifacts, isEditable);
}
