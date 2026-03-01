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
import type { TDomain } from "@plane/types";
// hooks
import { isSSOError } from "@plane/services";
// plane web imports
import { CopyableField } from "@/components/workspace/settings/identity/common/copyable-field";
import { useDomainActions } from "@/plane-web/hooks/sso/use-domain-actions";
// local components
import { ModalFormFooter } from "./modal-form-footer";
import { ModalFormHeader } from "./modal-form-header";
import { NumberedInstructions } from "./numbered-instructions";

type TVerifyDomainForm = {
  domain: TDomain;
  onClose: () => void;
  workspaceSlug: string;
};

export function VerifyDomainForm(props: TVerifyDomainForm) {
  const { domain, onClose, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // SWR hooks
  const { verifyDomain, isVerifying } = useDomainActions(workspaceSlug);

  const handleVerify = async () => {
    try {
      await verifyDomain(domain.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("sso.domain_management.verified_domains.verify_domain.toast.success_title"),
        message: t("sso.domain_management.verified_domains.verify_domain.toast.success_message"),
      });
      onClose();
    } catch (error) {
      console.error("Failed to verify domain", error);
      let errorMessage = t("sso.domain_management.verified_domains.verify_domain.toast.error_message");
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
    <div className="flex flex-col p-4">
      <ModalFormHeader
        title={t("sso.domain_management.verified_domains.verify_domain.title")}
        description={t("sso.domain_management.verified_domains.verify_domain.description")}
      />
      <div className="space-y-4 py-5">
        <NumberedInstructions
          label={t("sso.domain_management.verified_domains.verify_domain.instructions.label")}
          instructions={[
            t("sso.domain_management.verified_domains.verify_domain.instructions.step_1"),
            <>
              {t("sso.domain_management.verified_domains.verify_domain.instructions.step_2.part_1")}{" "}
              <span className="font-semibold">
                {t("sso.domain_management.verified_domains.verify_domain.instructions.step_2.part_2")}
              </span>{" "}
              {t("sso.domain_management.verified_domains.verify_domain.instructions.step_2.part_3")}
            </>,
            t("sso.domain_management.verified_domains.verify_domain.instructions.step_3"),
            t("sso.domain_management.verified_domains.verify_domain.instructions.step_4"),
          ]}
        />
        <CopyableField
          label={t("sso.domain_management.verified_domains.verify_domain.domain_label")}
          value={domain.domain}
        />
        <CopyableField
          label={t("sso.domain_management.verified_domains.verify_domain.verification_code_label")}
          value={domain.verification_token}
          description={t("sso.domain_management.verified_domains.verify_domain.verification_code_description")}
        />
      </div>
      <ModalFormFooter
        primaryButtonText={t("sso.domain_management.verified_domains.verify_domain.primary_button_text")}
        primaryButtonLoadingText={t("sso.domain_management.verified_domains.verify_domain.primary_button_loading_text")}
        onPrimaryClick={() => void handleVerify()}
        onSecondaryClick={onClose}
        isLoading={isVerifying}
        secondaryButtonText={t("sso.domain_management.verified_domains.verify_domain.secondary_button_text")}
      />
    </div>
  );
}
