/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// Plane Imports
import { useTranslation } from "@plane/i18n";
import { TypeToConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import type { IWorkspace } from "@plane/types";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserSettings } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  data: IWorkspace | null;
  isOpen: boolean;
  onClose: () => void;
};

export const DeleteWorkspaceForm = observer(function DeleteWorkspaceForm(props: Props) {
  const { data, isOpen, onClose } = props;
  // router
  const router = useAppRouter();
  // store hooks
  const { deleteWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const { getWorkspaceRedirectionUrl } = useWorkspace();
  const { fetchCurrentUserSettings } = useUserSettings();

  const onSubmit = async () => {
    if (!data) return;

    try {
      await deleteWorkspace(data.slug);
      await fetchCurrentUserSettings();
      onClose();
      router.push(getWorkspaceRedirectionUrl());
      setToast({
        type: "success",
        title: t("workspace_settings.settings.general.delete_modal.success_title"),
        message: t("workspace_settings.settings.general.delete_modal.success_message"),
      });
    } catch (_error) {
      setToast({
        type: "error",
        title: t("workspace_settings.settings.general.delete_modal.error_title"),
        message: t("workspace_settings.settings.general.delete_modal.error_message"),
      });
    }
  };

  return (
    <TypeToConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onSubmit}
      title={t("workspace_settings.settings.general.delete_modal.title")}
      description={
        <>
          You are about to delete the workspace <span className="text-body-xs-semibold break-words">{data?.name}</span>.
          If you confirm, you will lose access to all your work data in this workspace without any way to restore it.
          Tread very carefully.
        </>
      }
      fields={[
        { name: "workspaceName", label: "Type in this workspace's name to continue.", expectedValue: data?.name ?? "" },
        {
          name: "confirmDelete",
          label: 'For final confirmation, type "delete my workspace" below.',
          expectedValue: "delete my workspace",
        },
      ]}
      confirmLabel={t("confirm")}
      loadingLabel={t("deleting")}
    />
  );
});
