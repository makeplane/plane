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

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import type { TProject } from "@plane/types";
import { Card, cn } from "@plane/ui";
import { CreateProjectForm } from "@/components/projects/create/root";
import type { TArtifact, TUpdatedArtifact } from "@/types";
import { useProjectData } from "../useArtifactData";
import { PiChatArtifactsFooter } from "./footer";
import { getRandomCoverImage } from "@/helpers/cover-image.helper";
import { getRandomEmoji } from "@plane/utils";

interface TProjectDetailProps {
  data: TArtifact;
  updateArtifact: (data: TUpdatedArtifact) => Promise<void>;
  workspaceSlug: string;
  activeChatId: string;
}

export const ProjectDetail = observer(function ProjectDetail(props: TProjectDetailProps) {
  // props
  const { data, updateArtifact, workspaceSlug, activeChatId } = props;
  // state
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // hooks
  const projectData = useProjectData(data.artifact_id);

  // handlers
  const handleOnSave = () => {
    setIsSaving(false);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      setError(null);
    }, 1000);
  };
  const handleOnChange = async (formData: Partial<TProject> | null) => {
    if (!formData) return;
    setIsSaving(true);
    await updateArtifact(formData)
      .then(() => {
        handleOnSave();
      })
      .catch((error) => {
        console.error(error);
        setError(error?.message || String(error));
        handleOnSave();
      });
  };

  const hasUpdatedRef = useRef(false);
  const coverImageUrl = projectData?.cover_image_url;
  const logoProps = projectData?.logo_props;

  useEffect(() => {
    // Only run on client to avoid hydration mismatches
    if (typeof window === "undefined") return;
    // Only update once per artifact
    if (hasUpdatedRef.current) return;
    // Skip if already has both cover image and logo
    if (coverImageUrl && logoProps) return;

    hasUpdatedRef.current = true;

    const updateCoverImageAndLogo = async () => {
      // Generate random values only on client side
      const img = getRandomCoverImage();
      await updateArtifact({
        ...(projectData || {}),
        cover_image_url: coverImageUrl || img,
        logo_props: logoProps || {
          in_use: "emoji",
          emoji: {
            value: getRandomEmoji(),
          },
        },
      });
    };

    void updateCoverImageAndLogo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.artifact_id]);
  return (
    <>
      <Card className="relative max-w-[700px] rounded-xl shadow-lg p-0 space-y-0">
        <CreateProjectForm
          workspaceSlug={workspaceSlug}
          onClose={() => {}}
          handleNextStep={() => {}}
          data={projectData}
          templateId={undefined}
          showActionButtons={false}
          onChange={handleOnChange}
          updateCoverImageStatus={() => Promise.resolve()}
          dataResetProperties={[data.artifact_id, projectData]}
        />
        <div
          className={cn("absolute top-0 right-0 w-full h-full bg-surface-1 rounded-xl opacity-50", {
            hidden: data.is_editable,
          })}
        />
      </Card>
      <PiChatArtifactsFooter
        artifactsData={data}
        workspaceSlug={workspaceSlug}
        activeChatId={activeChatId}
        artifactId={data.artifact_id}
        isSaving={isSaving}
        showSavedToast={showSavedToast}
        error={error}
      />
    </>
  );
});
