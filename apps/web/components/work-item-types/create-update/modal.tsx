/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useSWRConfig } from "swr";
// plane imports
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { PROJECT_ISSUE_TYPES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
// hooks
import { useIssueTypes } from "@/hooks/store/use-issue-types";
// local imports
import { getIssueTypeLogoIcon, ISSUE_TYPE_LOGO_COLORS, ISSUE_TYPE_LOGO_ICONS } from "../common/issue-type-logo";
import type { TIssueTypeFormValues } from "./form";
import { CreateOrUpdateIssueTypeForm } from "./form";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueTypeId: string | null;
  isOpen: boolean;
  handleClose: () => void;
};

const getRandomLogo = () => ({
  name: ISSUE_TYPE_LOGO_ICONS[Math.floor(Math.random() * ISSUE_TYPE_LOGO_ICONS.length)].name,
  background_color: ISSUE_TYPE_LOGO_COLORS[Math.floor(Math.random() * ISSUE_TYPE_LOGO_COLORS.length)],
});

const getDefaultFormValues = (): TIssueTypeFormValues => ({
  name: "",
  description: "",
  logo_props: { in_use: "icon", icon: getRandomLogo() },
});

export const CreateOrUpdateIssueTypeModal = observer(function CreateOrUpdateIssueTypeModal(props: Props) {
  const { workspaceSlug, projectId, issueTypeId, isOpen, handleClose } = props;
  // store hooks
  const { createIssueType, updateIssueType, getIssueTypeById } = useIssueTypes();
  // swr
  const { mutate } = useSWRConfig();
  // translation
  const { t } = useTranslation();
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TIssueTypeFormValues>(getDefaultFormValues);
  // derived values
  const isEdit = Boolean(issueTypeId);

  useEffect(() => {
    if (!isOpen) return;
    const issueType = issueTypeId ? getIssueTypeById(issueTypeId) : undefined;
    if (issueType) {
      const icon = getIssueTypeLogoIcon(issueType.logo_props);
      setFormData({
        name: issueType.name,
        description: issueType.description ?? "",
        logo_props: {
          in_use: "icon",
          icon: {
            name: icon.name ?? getRandomLogo().name,
            background_color: icon.background_color ?? getRandomLogo().background_color,
          },
        },
      });
    } else {
      setFormData(getDefaultFormValues());
    }
  }, [isOpen, issueTypeId, getIssueTypeById]);

  const handleCloseModal = () => {
    setFormData(getDefaultFormValues());
    handleClose();
  };

  const handleSubmit = async () => {
    if (!workspaceSlug || !projectId) return;
    setIsSubmitting(true);
    try {
      if (issueTypeId) {
        await updateIssueType(workspaceSlug, projectId, issueTypeId, {
          name: formData.name,
          description: formData.description,
          logo_props: formData.logo_props,
        });
        setToast({
          type: "success",
          title: t("work_item_types.update.toast.success.title"),
          message: t("work_item_types.update.toast.success.message", { name: formData.name }),
        });
      } else {
        await createIssueType(workspaceSlug, projectId, {
          name: formData.name,
          description: formData.description,
          logo_props: formData.logo_props,
          is_active: true,
        });
        setToast({
          type: "success",
          title: t("work_item_types.create.toast.success.title"),
          message: t("work_item_types.create.toast.success.message"),
        });
      }
      await mutate(PROJECT_ISSUE_TYPES(workspaceSlug, projectId));
      handleCloseModal();
    } catch (error) {
      const errorCode =
        (error as { code?: string; data?: { code?: string } })?.code ??
        (error as { data?: { code?: string } })?.data?.code;
      const isConflict = errorCode === "ISSUE_TYPE_ALREADY_EXIST";
      const namespace = isEdit ? "work_item_types.update" : "work_item_types.create";
      setToast({
        type: "error",
        title: t(`${namespace}.toast.error.title`),
        message: isConflict
          ? t(`${namespace}.toast.error.message.conflict`, { name: formData.name })
          : t(`${namespace}.toast.error.message.default`),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleCloseModal();
      }}
    >
      <DialogContent size="md">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>
                {isEdit ? t("work_item_types.update.title") : t("work_item_types.create.title")}
              </DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody>
            <CreateOrUpdateIssueTypeForm
              formData={formData}
              isSubmitting={isSubmitting}
              isEdit={isEdit}
              onChange={setFormData}
              onClose={handleCloseModal}
              onSubmit={handleSubmit}
            />
          </DialogBody>
        </DialogMain>
      </DialogContent>
    </Dialog>
  );
});
