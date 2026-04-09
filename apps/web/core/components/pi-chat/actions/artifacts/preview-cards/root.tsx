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
import { CyclePreviewCard } from "./cycle";
import { ModulePreviewCard } from "./module";
import { PagePreviewCard } from "./page";
import { ProjectPreviewCard } from "./project";
import { ViewPreviewCard } from "./view";
import { WorkItemPreviewCard } from "./work-item";
import { AddRemovePreviewCard } from "./add-remove";
import { DeleteArchivePreviewCard } from "./delete-archieve";
import { TemplatePreviewCard } from "./template";
import { CommentPreviewCard } from "./comment";
import { WorklogPreviewCard } from "./worklogs";
import { McpsPreviewCard } from "./mcps";
import { LinkPreviewCard } from "./link";

// --- Main PreviewCard Component ---
export const PreviewCard = observer(function PreviewCard(props: {
  artifactId: string;
  type: string;
  action: string;
  isEditable: boolean;
}) {
  const { artifactId, type, action, isEditable } = props;

  // Special cases
  if (type === "comment") return <CommentPreviewCard artifactId={artifactId} isEditable={isEditable} />;
  if (["add", "remove"].includes(action))
    return <AddRemovePreviewCard artifactId={artifactId} isEditable={isEditable} />;
  if (["delete", "archive"].includes(action))
    return <DeleteArchivePreviewCard artifactId={artifactId} isEditable={isEditable} />;

  switch (type) {
    case "link":
      return <LinkPreviewCard artifactId={artifactId} isEditable={isEditable} />;
    case "workitem":
      return <WorkItemPreviewCard artifactId={artifactId} isEditable={isEditable} />;
    case "epic":
      return <WorkItemPreviewCard artifactId={artifactId} isEpic isEditable={isEditable} />;
    case "page":
      return <PagePreviewCard artifactId={artifactId} isEditable={isEditable} />;
    case "cycle":
      return <CyclePreviewCard artifactId={artifactId} isEditable={isEditable} />;
    case "module":
      return <ModulePreviewCard artifactId={artifactId} isEditable={isEditable} />;
    case "view":
      return <ViewPreviewCard artifactId={artifactId} isEditable={isEditable} />;
    case "project":
      return <ProjectPreviewCard artifactId={artifactId} isEditable={isEditable} />;
    case "comment":
      return <CommentPreviewCard artifactId={artifactId} isEditable={isEditable} />;
    case "worklog":
      return <WorklogPreviewCard artifactId={artifactId} isEditable={isEditable} />;
    case "mcp":
      return <McpsPreviewCard artifactId={artifactId} isEditable={isEditable} />;
    default:
      return <TemplatePreviewCard artifactId={artifactId} isEditable={isEditable} />;
  }
});
