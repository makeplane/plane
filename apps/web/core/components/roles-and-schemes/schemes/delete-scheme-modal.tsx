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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { CloseIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { PermissionSchemeImpact } from "@plane/types";
import { RolesAndPermissionsService } from "@plane/services";
import { EModalPosition, EModalWidth, Loader, ModalCore } from "@plane/ui";
// hooks
import { usePermissionScheme } from "@/hooks/store/use-permission-scheme";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  schemeId: string | null;
};

export const DeleteSchemeModal = observer(function DeleteSchemeModal(props: Props) {
  const { isOpen, onClose, workspaceSlug, schemeId } = props;
  // states
  const [impact, setImpact] = useState<PermissionSchemeImpact | null>(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;
  // service
  const service = useMemo(() => new RolesAndPermissionsService(), []);
  // store hooks
  const { deleteScheme } = usePermissionScheme();

  // Fetch impact when modal opens
  const fetchImpact = useCallback(async () => {
    if (!schemeId) return;
    setIsLoadingImpact(true);
    try {
      const data = await service.getPermissionSchemeImpact(workspaceSlug, schemeId);
      setImpact(data);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: tRef.current("error"),
        message: tRef.current(
          "workspace_settings.settings.roles_and_schemes.delete_scheme_modal.error_toast_description"
        ),
      });
    } finally {
      setIsLoadingImpact(false);
    }
  }, [schemeId, workspaceSlug, service]);

  useEffect(() => {
    if (isOpen && schemeId) {
      fetchImpact();
    }
  }, [isOpen, schemeId, fetchImpact]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setImpact(null);
      setIsLoadingImpact(false);
      setIsDeleting(false);
    }
  }, [isOpen]);

  const hasRoles = impact !== null && impact.roles > 0;
  const isSubmitDisabled = isDeleting || isLoadingImpact;

  const handleClose = () => {
    if (isDeleting) return;
    onClose();
  };

  const handleDelete = async () => {
    if (!schemeId) return;
    try {
      setIsDeleting(true);
      await deleteScheme({ workspaceSlug, schemeId });
      handleClose();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("workspace_settings.settings.roles_and_schemes.delete_scheme_modal.success_toast_message"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("workspace_settings.settings.roles_and_schemes.delete_scheme_modal.in_use_error"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!schemeId) return null;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <h4 className="text-h4-medium text-secondary">
          {t("workspace_settings.settings.roles_and_schemes.delete_scheme_modal.confirm_title")}
        </h4>
        <IconButton icon={CloseIcon} variant="ghost" onClick={handleClose} />
      </div>
      {/* Body */}
      <div className="px-5 py-4">
        {isLoadingImpact ? (
          <Loader className="space-y-2">
            <Loader.Item height="16px" width="100%" />
            <Loader.Item height="16px" width="60%" />
          </Loader>
        ) : (
          <p className="text-body-sm-regular text-secondary">
            {hasRoles
              ? t("workspace_settings.settings.roles_and_schemes.delete_scheme_modal.has_roles_message", {
                  count: impact.roles,
                })
              : t("workspace_settings.settings.roles_and_schemes.delete_scheme_modal.no_roles_message")}
          </p>
        )}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-subtle px-5 py-4">
        <Button variant="secondary" onClick={handleClose} disabled={isDeleting}>
          {t("cancel")}
        </Button>
        <Button variant="error-fill" onClick={handleDelete} disabled={isSubmitDisabled} loading={isDeleting}>
          {t("workspace_settings.settings.roles_and_schemes.delete_scheme_modal.submit_button")}
        </Button>
      </div>
    </ModalCore>
  );
});
