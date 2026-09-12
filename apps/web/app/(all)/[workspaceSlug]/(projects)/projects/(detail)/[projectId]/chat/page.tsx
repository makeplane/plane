/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { ChatRoot } from "@/components/chat";
import { PageHead } from "@/components/core/page-title";
// hooks
import { useProject } from "@/hooks/store/use-project";

const ProjectChatPage = observer(function ProjectChatPage() {
  const { workspaceSlug, projectId } = useParams();
  const slug = workspaceSlug?.toString() ?? "";
  const project = projectId?.toString() ?? "";
  // store hooks
  const { currentProjectDetails } = useProject();
  const scope = useMemo(() => ({ workspaceSlug: slug, projectId: project }), [slug, project]);

  if (!slug || !project) return null;

  return (
    <>
      <PageHead title={currentProjectDetails?.name ? `${currentProjectDetails.name} - Chat` : "Chat"} />
      <div className="relative h-full w-full overflow-hidden">
        <ChatRoot scope={scope} />
      </div>
    </>
  );
});

export default ProjectChatPage;
