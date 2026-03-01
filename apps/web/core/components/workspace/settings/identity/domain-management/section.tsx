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

import { useMemo, useState } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// hooks
import { useDomains } from "@/plane-web/hooks/sso/use-domains";
// plane web imports
import { IdentitySettingsSection } from "@/components/workspace/settings/identity/common/identity-settings-section";
import { IdentitySettingsSubSection } from "@/components/workspace/settings/identity/common/identity-settings-sub-section";
// local components
import { AddDomainModal } from "./add-domain-modal/root";
import { DeleteDomainModal } from "./delete-domain-modal";
import { DomainList } from "./domain-list";

type TDomainManagementSection = {
  workspaceSlug: string;
};

type TCreateOrVerifyDomainModalType = { type: "CREATE" } | { type: "VERIFY"; domainId: string };

export function DomainManagementSection(props: TDomainManagementSection) {
  const { workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // SWR hooks
  const { isLoading, domains, getDomainById } = useDomains(workspaceSlug);
  // states
  const [createOrVerifyDomainModalType, setCreateOrVerifyDomainModalType] =
    useState<TCreateOrVerifyDomainModalType | null>(null);
  const [deleteDomainId, setDeleteDomainId] = useState<string | null>(null);
  // derived values
  const deleteDomain = useMemo(
    () => (deleteDomainId ? getDomainById(deleteDomainId) : undefined),
    [deleteDomainId, getDomainById]
  );

  return (
    <IdentitySettingsSection sectionTitle={t("sso.domain_management.header")}>
      <IdentitySettingsSubSection
        subsectionTitle={t("sso.domain_management.verified_domains.header")}
        subsectionDescription={t("sso.domain_management.verified_domains.description")}
        action={
          <Button variant="secondary" onClick={() => setCreateOrVerifyDomainModalType({ type: "CREATE" })} size="lg">
            {t("sso.domain_management.verified_domains.button_text")}
          </Button>
        }
      >
        {/* Domain list */}
        <DomainList
          workspaceSlug={workspaceSlug}
          domains={domains || []}
          isLoading={isLoading}
          onVerifyClick={(domainId) => setCreateOrVerifyDomainModalType({ type: "VERIFY", domainId })}
          onDeleteClick={(domainId) => setDeleteDomainId(domainId)}
        />
        {/* Add domain modal */}
        {createOrVerifyDomainModalType && (
          <AddDomainModal
            domain={
              createOrVerifyDomainModalType.type === "VERIFY"
                ? getDomainById(createOrVerifyDomainModalType.domainId)
                : undefined
            }
            workspaceSlug={workspaceSlug}
            isOpen={!!createOrVerifyDomainModalType}
            onClose={() => setCreateOrVerifyDomainModalType(null)}
          />
        )}
        {/* Delete domain modal */}
        {deleteDomain && (
          <DeleteDomainModal
            domain={deleteDomain}
            isOpen={!!deleteDomainId}
            onClose={() => setDeleteDomainId(null)}
            workspaceSlug={workspaceSlug}
          />
        )}
      </IdentitySettingsSubSection>
    </IdentitySettingsSection>
  );
}
