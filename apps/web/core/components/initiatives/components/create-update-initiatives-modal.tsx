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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import useKeypress from "@/hooks/use-keypress";
// Plane web
import { DEFAULT_INITIATIVE_STATE } from "@/constants/initiative";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiative } from "@/types";
// local
import { CreateUpdateInitiativeForm } from "./form";

type Props = {
  initiativeId?: string;
  isOpen: boolean;
  handleClose: () => void;
};

const defaultValues: Partial<TInitiative> = {
  name: "",
  description_html: "",
  start_date: null,
  end_date: null,
  lead: null,
  project_ids: [],
  epic_ids: [],
  label_ids: [],
  state: DEFAULT_INITIATIVE_STATE,
};

export const CreateUpdateInitiativeModal = observer(function CreateUpdateInitiativeModal(props: Props) {
  const { initiativeId, isOpen, handleClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<TInitiative> | undefined>();
  // store hooks
  const {
    initiative: { createInitiative, updateInitiative, getInitiativeById },
  } = useInitiatives();

  const { t } = useTranslation();
  // derived values
  const initiativeDetail = initiativeId ? getInitiativeById(initiativeId) : undefined;

  useEffect(() => {
    if (isOpen) {
      if (initiativeId && !initiativeDetail) return;
      if (initiativeDetail) {
        setFormData(initiativeDetail);
      } else {
        setFormData({
          ...defaultValues,
        });
      }
    }
  }, [initiativeId, initiativeDetail, isOpen]);

  // handlers
  const handleFormDataChange = <T extends keyof TInitiative>(key: T, value: TInitiative[T] | undefined) =>
    setFormData((prev) => (prev ? { ...prev, [key]: value } : undefined));

  const handleModalClearAndClose = () => {
    setFormData(undefined);
    handleClose();
  };

  const handleCreate = async () => {
    if (!formData) return;

    setIsSubmitting(true);
    await createInitiative(workspaceSlug?.toString(), formData)
      .then(() => {
        handleModalClearAndClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("toast.success"),
          message: t("initiatives.toast.create_success", { name: formData?.name }),
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: error?.error ?? t("initiatives.toast.create_error"),
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleUpdate = async () => {
    if (!initiativeId || !formData) return;

    setIsSubmitting(true);
    await updateInitiative(workspaceSlug?.toString(), initiativeId, formData)
      .then(() => {
        handleModalClearAndClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("toast.success"),
          message: t("initiatives.toast.update_success", { name: formData?.name }),
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: error?.error ?? t("initiatives.toast.update_error"),
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  useKeypress("Escape", () => {
    if (isOpen) handleModalClearAndClose();
  });

  return (
    <ModalCore
      isOpen={isOpen}
      position={EModalPosition.TOP}
      width={EModalWidth.XXXXL}
      className="rounded-lg shadow-none transition-[width] ease-linear"
    >
      <CreateUpdateInitiativeForm
        initiativeDetail={initiativeDetail}
        formData={formData}
        isSubmitting={isSubmitting}
        handleFormDataChange={handleFormDataChange}
        handleClose={handleModalClearAndClose}
        handleFormSubmit={initiativeId ? handleUpdate : handleCreate}
      />
    </ModalCore>
  );
});
