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

// plane imports
import { SSO_ERROR_MESSAGES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { isSSOError } from "@plane/services";
import { AlertModalCore } from "@plane/ui";
// hooks
import { useDomainActions } from "@/plane-web/hooks/sso/use-domain-actions";
import type { TDomain } from "@plane/types";

type TDeleteDomainModal = {
  domain: TDomain;
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
};

export function DeleteDomainModal(props: TDeleteDomainModal) {
  const { domain, isOpen, onClose, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // SWR hooks
  const { deleteDomain, isDeleting } = useDomainActions(workspaceSlug);

  const handleDelete = async () => {
    try {
      await deleteDomain(domain.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("sso.domain_management.verified_domains.delete_domain.toast.success_title"),
        message: t("sso.domain_management.verified_domains.delete_domain.toast.success_message"),
      });
      onClose();
    } catch (error) {
      console.error("Failed to delete domain", error);
      let errorMessage = t("sso.domain_management.verified_domains.delete_domain.toast.error_message");
      if (isSSOError(error)) {
        const message = SSO_ERROR_MESSAGES[error.response.data.error_code];
        errorMessage = message;
      }
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: errorMessage,
      });
    }
  };

  return (
    <AlertModalCore
      isOpen={isOpen}
      handleClose={onClose}
      handleSubmit={() => void handleDelete()}
      isSubmitting={isDeleting}
      title={t("sso.domain_management.verified_domains.delete_domain.title")}
      content={
        <>
          {t("sso.domain_management.verified_domains.delete_domain.description.prefix")}{" "}
          <span className="font-semibold">{domain.domain}</span>{" "}
          {t("sso.domain_management.verified_domains.delete_domain.description.suffix")}
        </>
      }
      primaryButtonText={{
        loading: t("sso.domain_management.verified_domains.delete_domain.primary_button_loading_text"),
        default: t("sso.domain_management.verified_domains.delete_domain.primary_button_text"),
      }}
      secondaryButtonText={t("sso.domain_management.verified_domains.delete_domain.secondary_button_text")}
      variant="danger"
    />
  );
}
