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
import { useTranslation } from "@plane/i18n";
// hooks
import { useDomains } from "@/plane-web/hooks/sso/use-domains";
import { useProviders } from "@/plane-web/hooks/sso/use-providers";
// plane web imports
import { IdentitySettingsSection } from "@/components/workspace/settings/identity/common/identity-settings-section";
// local components
import { OIDCSection } from "./oidc/section";
import { SAMLSection } from "./saml/section";

type TProviderSection = {
  workspaceSlug: string;
};

export function ProviderSection(props: TProviderSection) {
  const { workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // SWR hooks
  const { hasAnyVerifiedDomain } = useDomains(workspaceSlug);
  const { isLoading, oidcProvider, samlProvider } = useProviders(workspaceSlug);

  return (
    <IdentitySettingsSection sectionTitle={t("sso.providers.header")}>
      <div className="flex flex-col gap-6">
        <SAMLSection
          isDisabled={!hasAnyVerifiedDomain}
          isInitializing={isLoading}
          workspaceSlug={workspaceSlug}
          samlProvider={samlProvider}
        />
        <OIDCSection
          isDisabled={!hasAnyVerifiedDomain}
          isInitializing={isLoading}
          workspaceSlug={workspaceSlug}
          oidcProvider={oidcProvider}
        />
      </div>
    </IdentitySettingsSection>
  );
}
