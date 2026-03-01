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
import { IntakePublishForm } from "@plane/propel/domain/intake-form";
import { CloseIcon } from "@plane/propel/icons";
import type { EIssuePropertyType, TIssueProperty } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { useProject } from "@/hooks/store/use-project";
import { useIssueType } from "@/plane-web/hooks/store";
import { DEFAULT_COVER_IMAGE_URL } from "@/helpers/cover-image.helper";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  typeId: string;
  formTitle: string;
  selectedFields: string[];
};

export const IntakeFormPreviewModal = observer(function IntakeFormPreviewModal(props: Props) {
  const { isOpen, onClose, projectId, typeId, formTitle, selectedFields } = props;

  // hooks
  const workItemType = useIssueType(typeId);
  const { getProjectById } = useProject();

  if (!workItemType || !isOpen) return null;

  // derived values
  const currentProjectDetails = getProjectById(projectId);

  if (!currentProjectDetails) return null;

  // Map selected fields to the format expected by IntakePublishForm
  const formProperties = selectedFields
    .map((fieldId) => {
      const property = workItemType.getPropertyById(fieldId);
      if (!property) return null;
      return {
        property: property as unknown as TIssueProperty<EIssuePropertyType>,
        options: property.propertyOptions?.map((opt) => opt.asJSON) || [],
      };
    })
    .filter((prop) => prop !== null);

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={onClose}
      position={EModalPosition.TOP}
      width={EModalWidth.XXXXL}
      className="p-5"
    >
      <div className="flex items-center justify-between text-placeholder sticky">
        <span className="text-13 font-medium">Preview</span>
        <CloseIcon className="size-4 cursor-pointer" onClick={onClose} />
      </div>
      <div className="">
        <div className="max-w-xl mx-auto">
          <div className="p-6 pt-4 shadow-md rounded-md border border-subtle">
            <IntakePublishForm
              projectName={currentProjectDetails.name || ""}
              projectLogo={currentProjectDetails.logo_props}
              projectCoverImage={currentProjectDetails.cover_image_url}
              projectCoverImageFallback={DEFAULT_COVER_IMAGE_URL}
              formTitle={formTitle || ""}
              properties={formProperties}
              onSubmit={async (data) => console.log("Form submitted:", data)}
            />
          </div>
        </div>
      </div>
    </ModalCore>
  );
});
