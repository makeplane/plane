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

import { useMemo } from "react";
import { isEmpty } from "lodash-es";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// store hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { CopyableField } from "@/components/workspace/settings/identity/common/copyable-field";
import { AttributeMappingTable } from "@/components/workspace/settings/identity/provider/common/attribute-mapping-table";
import { ProviderSetupDetailsTab } from "@/components/workspace/settings/identity/provider/common/setup-details-tab";
import { ProviderSetupModal } from "@/components/workspace/settings/identity/provider/common/setup-modal";

type TSAMLSetupModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SAMLSetupModal(props: TSAMLSetupModalProps) {
  const { isOpen, onClose } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  // derived values
  const baseURL = !isEmpty(API_BASE_URL) ? API_BASE_URL : typeof window !== "undefined" ? window.location.origin : "";
  const workspaceId = currentWorkspace?.id;

  // Generate service details URLs
  const webDetails = useMemo(
    () => [
      {
        label: t("sso.providers.saml.setup_modal.web_details.entity_id.label"),
        value: workspaceId ? `${baseURL}/auth/sso/saml/metadata/${workspaceId}/` : "",
        description: t("sso.providers.saml.setup_modal.web_details.entity_id.description"),
      },
      {
        label: t("sso.providers.saml.setup_modal.web_details.callback_url.label"),
        value: workspaceId ? `${baseURL}/auth/sso/saml/callback/${workspaceId}/` : "",
        description: t("sso.providers.saml.setup_modal.web_details.callback_url.description"),
      },
      {
        label: t("sso.providers.saml.setup_modal.web_details.logout_url.label"),
        value: workspaceId ? `${baseURL}/auth/sso/saml/logout/${workspaceId}/` : "",
        description: t("sso.providers.saml.setup_modal.web_details.logout_url.description"),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceId, baseURL]
  );

  const mobileDetails = useMemo(
    () => [
      {
        label: t("sso.providers.saml.setup_modal.mobile_details.entity_id.label"),
        value: workspaceId ? `${baseURL}/auth/mobile/saml/metadata/${workspaceId}/` : "",
        description: t("sso.providers.saml.setup_modal.mobile_details.entity_id.description"),
      },
      {
        label: t("sso.providers.saml.setup_modal.mobile_details.callback_url.label"),
        value: workspaceId ? `${baseURL}/auth/mobile/saml/callback/${workspaceId}/` : "",
        description: t("sso.providers.saml.setup_modal.mobile_details.callback_url.description"),
      },
      {
        label: t("sso.providers.saml.setup_modal.mobile_details.logout_url.label"),
        value: workspaceId ? `${baseURL}/auth/mobile/saml/logout/${workspaceId}/` : "",
        description: t("sso.providers.saml.setup_modal.mobile_details.logout_url.description"),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceId, baseURL]
  );

  const tabs = useMemo(
    () =>
      [
        {
          key: "web" as const,
          label: "Web",
          content: (
            <ProviderSetupDetailsTab title={t("sso.providers.saml.setup_modal.web_details.header")}>
              {webDetails.map((detail, index) => (
                <CopyableField key={index} label={detail.label} value={detail.value} description={detail.description} />
              ))}
            </ProviderSetupDetailsTab>
          ),
        },
        // {
        //   key: "mobile" as const,
        //   label: "Mobile",
        //   content: (
        //     <ProviderSetupDetailsTab title={t("sso.providers.saml.setup_modal.mobile_details.header")}>
        //       {mobileDetails.map((detail, index) => (
        //         <CopyableField key={index} label={detail.label} value={detail.value} description={detail.description} />
        //       ))}
        //     </ProviderSetupDetailsTab>
        //   ),
        // },
        {
          key: "mapping" as const,
          label: "Mapping",
          content: (
            <ProviderSetupDetailsTab title={t("sso.providers.saml.setup_modal.mapping_table.header")}>
              <AttributeMappingTable t={t} />
            </ProviderSetupDetailsTab>
          ),
        },
      ] as const,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [webDetails, mobileDetails]
  );

  return <ProviderSetupModal isOpen={isOpen} onClose={onClose} tabs={tabs} />;
}
