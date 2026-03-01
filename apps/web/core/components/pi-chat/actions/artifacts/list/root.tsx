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

import type { TArtifact } from "@/types";
import { PreviewCard } from "../preview-cards/root";

export function PiChatArtifactsListRoot(props: { artifacts: TArtifact[] }) {
  const { artifacts } = props;
  return (
    <div className="flex flex-col gap-4">
      {artifacts.map((artifact) => (
        <PreviewCard
          key={artifact.artifact_id}
          artifactId={artifact.artifact_id}
          type={artifact.artifact_type}
          action={artifact.action}
        />
      ))}
    </div>
  );
}
