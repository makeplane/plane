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
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@plane/propel/table";
import type { TDomain } from "@plane/types";
// local components
import { DomainListItem } from "./domain-list-item";
import { DomainListLoader } from "./domain-list-loader";

type TDomainList = {
  workspaceSlug: string;
  domains: TDomain[];
  isLoading: boolean;
  onVerifyClick: (domainId: string) => void;
  onDeleteClick: (domainId: string) => void;
};

export function DomainList(props: TDomainList) {
  const { domains, isLoading, onVerifyClick, onDeleteClick } = props;
  // plane hooks
  const { t } = useTranslation();

  if (isLoading) return <DomainListLoader />;
  if (domains.length === 0) return null;
  return (
    <div className="w-full">
      <Table>
        <TableHeader className="bg-transparent border-subtle">
          <TableRow>
            <TableHead className="text-body-xs-medium text-tertiary">
              {t("sso.domain_management.verified_domains.list.domain_name")}
            </TableHead>
            <TableHead className="text-body-xs-medium text-tertiary">
              {t("sso.domain_management.verified_domains.list.status")}
            </TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((domain) => {
            return (
              <DomainListItem
                key={domain.id}
                domain={domain}
                onVerifyClick={() => onVerifyClick(domain.id)}
                onDeleteClick={() => onDeleteClick(domain.id)}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
