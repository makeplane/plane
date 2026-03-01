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
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { UpgradeIcon } from "@plane/propel/icons";
// assets
import SAMLLogo from "@/app/assets/logos/saml-logo.svg?url";
import OIDCLogo from "@/app/assets/logos/oidc-logo.svg?url";
// local components
import { IdentitySettingsSubSection } from "./common/identity-settings-sub-section";
import { IdentitySettingsSection } from "./common/identity-settings-section";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const IdentityUpgrade = observer(function IdentityUpgrade() {
  // plane hooks
  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Main page header */}
      <div className="flex flex-col gap-1 border-b border-subtle pb-4">
        <h5 className="text-h5-medium text-primary">{t("sso.header")}</h5>
        <div className="text-body-xs-regular text-tertiary">{t("sso.description")}</div>
      </div>
      {/* Domain Management Section */}
      <IdentitySettingsSection sectionTitle={t("sso.domain_management.header")}>
        <IdentitySettingsSubSection
          subsectionTitle={t("sso.domain_management.verified_domains.header")}
          subsectionDescription={t("sso.domain_management.verified_domains.description")}
          action={<UpgradeButton />}
        />
      </IdentitySettingsSection>
      {/* Single sign-on section */}
      <IdentitySettingsSection sectionTitle={t("sso.providers.header")}>
        <div className="flex flex-col gap-6">
          <IdentitySettingsSubSection
            subsectionTitle={t("sso.providers.saml.header")}
            subsectionDescription={t("sso.providers.saml.description")}
            logo={{
              src: SAMLLogo,
              alt: "SAML Logo",
              className: "pl-0.5",
            }}
            action={<UpgradeButton />}
            showBorder
          />
          <IdentitySettingsSubSection
            subsectionTitle={t("sso.providers.oidc.header")}
            subsectionDescription={t("sso.providers.oidc.description")}
            logo={{
              src: OIDCLogo,
              alt: "OIDC Logo",
            }}
            action={<UpgradeButton />}
            showBorder
          />
        </div>
      </IdentitySettingsSection>
    </div>
  );
});

const UpgradeButton = observer(function UpgradeButton() {
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { togglePaidPlanModal } = useWorkspaceSubscription();

  return (
    <Button variant="secondary" prependIcon={<UpgradeIcon />} onClick={() => togglePaidPlanModal(true)}>
      {t("common.upgrade")}
    </Button>
  );
});
