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
import { useParams } from "next/navigation";
import { cn } from "@plane/utils";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import type { TArtifact, TUpdatedArtifact } from "@/types";
import { CycleDetail } from "./cycle";
import { EpicDetail } from "./epic";
import { Header } from "./header";
import { ModuleDetail } from "./module";
import { PageDetail } from "./page";
import { ProjectDetail } from "./project";
import { TemplateDetail } from "./template";
import { WorkItemDetail } from "./work-item";

const DetailCardRenderer = observer(function DetailCardRenderer(props: {
  artifactId: string;
  activeChatId: string;
  data: TArtifact;
  workspaceSlug: string;
  updateArtifact: (data: Partial<TUpdatedArtifact>) => Promise<void>;
}) {
  const { data } = props;
  switch (data.artifact_type) {
    case "workitem":
      return <WorkItemDetail {...props} />;
    case "page":
      return <PageDetail {...props} />;
    case "epic":
      return <EpicDetail {...props} />;
    case "module":
      return <ModuleDetail {...props} />;
    case "cycle":
      return <CycleDetail {...props} />;
    case "project":
      return <ProjectDetail {...props} />;
    default:
      return <TemplateDetail {...props} />;
  }
});

export const PiChatArtifactsRoot = observer(function PiChatArtifactsRoot() {
  // params
  const { workspaceSlug } = useParams();
  // hooks
  const {
    activeChatId,
    isPiArtifactsDrawerOpen: artifactId,
    artifactsStore: { getArtifact, updateArtifact },
  } = usePiChat();
  // derived values
  const artifactsData = artifactId && getArtifact(artifactId);
  if (!artifactsData) return null;

  return (
    <div
      className={cn(
        "transform transition-all duration-300 ease-in-out overflow-x-hidden",
        "rounded-lg border border-subtle-1 h-full max-w-[900px]",
        artifactId
          ? "translate-x-0 absolute top-0 right-0 w-auto lg:relative lg:w-[900px]  mr-2 z-30"
          : "px-0 translate-x-[100%] w-0 border-none"
      )}
    >
      <div
        className={cn("flex flex-col h-full rounded-lg bg-layer-2", {
          "bg-surface-1": artifactsData.artifact_type === "page",
        })}
      >
        {/* Header */}
        <Header artifact={artifactsData} />
        <div
          className={cn("flex-1 flex justify-center items-center px-4 h-full overflow-y-scroll relative", {
            "bg-surface-1 justify-start": artifactsData.artifact_type === "page",
          })}
        >
          <DetailCardRenderer
            artifactId={artifactId}
            activeChatId={activeChatId}
            workspaceSlug={workspaceSlug?.toString() || ""}
            data={artifactsData}
            updateArtifact={async (data: Partial<TUpdatedArtifact>) => {
              await updateArtifact(artifactId, "updated", data);
            }}
          />
        </div>
      </div>
    </div>
  );
});
