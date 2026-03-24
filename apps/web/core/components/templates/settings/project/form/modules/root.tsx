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

import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
// plane imports
import { MODULE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { PlusIcon } from "@plane/propel/icons";
import type { TProjectModuleBlueprint, TProjectTemplateForm } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// plane web imports
import { TemplateCollapsibleWrapper } from "@/components/templates/settings/common";
// local imports
import { TemplateModuleForm } from "./form";
import { TemplateModuleItem } from "./item";
import type { TModuleFormValues } from "./types";

// --- Modal ---

type TCreateUpdateTemplateModuleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TModuleFormValues) => void;
  data?: TProjectModuleBlueprint | null;
};

const CreateUpdateTemplateModuleModal = (props: TCreateUpdateTemplateModuleModalProps) => {
  const { isOpen, onClose, onSubmit, data } = props;

  const handleFormSubmit = (formData: TModuleFormValues) => {
    onSubmit(formData);
    onClose();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <TemplateModuleForm data={data} onCancel={onClose} onSubmit={handleFormSubmit} />
    </ModalCore>
  );
};

// --- Module List ---

export const ProjectModules = observer(function ProjectModules() {
  // states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [moduleToEdit, setModuleToEdit] = useState<TProjectModuleBlueprint | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // form context
  const { watch, setValue } = useFormContext<TProjectTemplateForm>();
  // derived values
  const projectModules = watch("project.modules");
  const showEmptyState = projectModules.length === 0;

  // comment 1: build lookup map once instead of .find() inside every map iteration
  const statusConfigMap = useMemo(() => Object.fromEntries(MODULE_STATUS.map((s) => [s.value, s])), []);

  const handleOpenCreateModal = useCallback(() => {
    setModuleToEdit(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((mod: TProjectModuleBlueprint) => {
    setModuleToEdit(mod);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setModuleToEdit(null);
  }, []);

  // comment 5: no useCallback — moduleToEdit invalidates on every open anyway
  const handleModuleSubmit = (formData: TModuleFormValues) => {
    if (moduleToEdit) {
      setValue(
        "project.modules",
        projectModules.map((m) => (m.id === moduleToEdit.id ? { id: m.id, ...formData } : m)),
        { shouldDirty: true }
      );
    } else {
      const newModule: TProjectModuleBlueprint = {
        id: uuidv4(),
        name: formData.name,
        description: formData.description,
        status: formData.status,
        lead_id: formData.lead_id,
        member_ids: formData.member_ids,
      };
      setValue("project.modules", [...projectModules, newModule], { shouldDirty: true });
    }
  };

  const handleModuleDelete = useCallback(
    (moduleId: string) => {
      setValue(
        "project.modules",
        projectModules.filter((m) => m.id !== moduleId),
        { shouldDirty: true }
      );
    },
    [projectModules, setValue]
  );

  return (
    <>
      <CreateUpdateTemplateModuleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModuleSubmit}
        data={moduleToEdit}
      />
      <TemplateCollapsibleWrapper
        title={t("modules")}
        actionElement={({ setIsOpen }) => (
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(true);
                handleOpenCreateModal();
              }}
            >
              <PlusIcon className="size-4" />
            </Button>
          </div>
        )}
      >
        <div className="flex flex-col gap-y-2 pt-2 pb-4">
          {showEmptyState && (
            <div className="px-5 text-body-xs-regular text-tertiary">
              {t("templates.empty_state.no_modules.description")}
            </div>
          )}
          {projectModules.map((mod) => (
            <TemplateModuleItem
              key={mod.id}
              mod={mod}
              statusConfig={statusConfigMap[mod.status]}
              onEdit={handleOpenEditModal}
              onDelete={handleModuleDelete}
            />
          ))}
        </div>
      </TemplateCollapsibleWrapper>
    </>
  );
});
