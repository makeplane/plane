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
import { useParams } from "next/navigation";
import useSWR from "swr";

import { PlusIcon, LayersIcon } from "@plane/propel/icons";
// components
import { Loader } from "@plane/ui";
import { useIntakeTypeForms } from "@/plane-web/hooks/store/use-intake-type-forms";
import { TypeFormCreateUpdateRoot } from "./create-update-form";
import { TypeFormListItem } from "./form-list-item";
import { SelectTypesModal } from "./select-types-modal";
import { IconButton } from "@plane/propel/icon-button";

export function TypeFormsRoot() {
  // router
  const { workspaceSlug, projectId } = useParams();

  // hooks
  const { fetchTypeForms, getProjectFormIds, isCustomFormsEnabled } = useIntakeTypeForms();
  //states
  const [isSelectTypesModalOpen, setIsSelectTypesModalOpen] = useState(false);

  const [formCreateList, setFormCreateList] = useState<string[]>([]);

  /**Fetch type forms */
  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `INTAKE_TYPE_FORMS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchTypeForms(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const isEnabled = isCustomFormsEnabled(workspaceSlug.toString(), projectId.toString());

  if (!workspaceSlug || !projectId || !isEnabled) return null;

  // derived values
  const projectFormIds = projectId ? getProjectFormIds(projectId.toString()) : [];

  // handlers
  const handleSelectType = (typeId: string) => {
    setFormCreateList((prev) => [...prev, typeId]);
  };

  const handleRemoveForm = (formId: string) => {
    setFormCreateList((prev) => prev.filter((id) => id !== formId));
  };

  return (
    <div className="border-t border-subtle pb-3">
      <div className="flex gap-2 px-3 pt-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <LayersIcon className="size-4" />{" "}
          <span className="text-11 font-medium text-secondary">Create Forms using work item types</span>
        </div>
        <IconButton size="sm" variant={"ghost"} icon={PlusIcon} onClick={() => setIsSelectTypesModalOpen(true)} />
      </div>
      {/* Existing forms */}
      {isLoading ? (
        <Loader className="flex flex-col gap-3 px-3 pt-3">
          <Loader.Item height="120px" />
          <Loader.Item height="120px" />
        </Loader>
      ) : (
        projectFormIds.length > 0 && (
          <div className="flex flex-col gap-3 px-3 pt-3">
            {projectFormIds.map((formId) => (
              <TypeFormListItem
                key={formId}
                formId={formId}
                projectId={projectId.toString()}
                workspaceSlug={workspaceSlug.toString()}
              />
            ))}
          </div>
        )
      )}
      {/* Create forms */}
      {formCreateList.length > 0 && (
        <div className="flex flex-col gap-3 px-3 pt-3">
          {formCreateList.map((typeId) => (
            <TypeFormCreateUpdateRoot
              key={typeId}
              typeId={typeId}
              handleRemove={() => handleRemoveForm(typeId)}
              onClose={() => handleRemoveForm(typeId)}
            />
          ))}
        </div>
      )}

      <SelectTypesModal
        isOpen={isSelectTypesModalOpen}
        onClose={() => setIsSelectTypesModalOpen(false)}
        onSelect={handleSelectType}
      />
    </div>
  );
}
