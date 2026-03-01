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

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EFileAssetType } from "@plane/types";
// components
import { DescriptionInput } from "@/components/editor/rich-text/description-input";
import { DescriptionInputLoader } from "@/components/editor/rich-text/description-input/loader";
// hooks
import { useUser } from "@/hooks/store/user";
import type { TProject } from "@/types";
import { Actions } from "./actions";
import { ProjectReaction } from "./update-reaction";

type TProps = {
  workspaceSlug: string;
  project: TProject;
  handleProjectUpdate: (data: Partial<TProject>) => Promise<void>;
  toggleLinkModalOpen: (value: boolean) => void;
  disabled?: boolean;
};
export const DescriptionBox = observer(function DescriptionBox(props: TProps) {
  const { workspaceSlug, project, handleProjectUpdate, toggleLinkModalOpen, disabled = false } = props;
  // states
  const [_isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  // store hooks
  const { data: currentUser } = useUser();
  // derived values
  const isDescriptionLoading = project.description_html === undefined;

  return (
    <div className="flex flex-col gap-4 w-full pt-4 px-10">
      {isDescriptionLoading ? (
        <DescriptionInputLoader />
      ) : (
        <DescriptionInput
          containerClassName="px-0 w-full"
          disabled={disabled}
          entityId={project.id}
          fileAssetType={EFileAssetType.PROJECT_DESCRIPTION}
          initialValue={project?.description_html ?? "<p></p>"}
          key={project.id}
          onSubmit={async (value) => {
            await handleProjectUpdate({ description_html: value.description_html });
          }}
          setIsSubmitting={setIsSubmitting}
          workspaceSlug={workspaceSlug}
        />
      )}
      <div className="flex items-center justify-between w-full gap-2 pb-6 border-b border-subtle-1">
        <ProjectReaction workspaceSlug={workspaceSlug} projectId={project.id} currentUser={currentUser} />
        <Actions toggleLinkModalOpen={toggleLinkModalOpen} workspaceSlug={workspaceSlug} projectId={project.id} />
      </div>
    </div>
  );
});
