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

import type { FC } from "react";
import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
// constants
import useSWR from "swr";
import { EUserPermissionsLevel } from "@plane/constants";
// components
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EUserWorkspaceRoles } from "@plane/types";
import searchEmptyDarkSvg from "@/app/assets/empty-state/customers/search-empty-dark.svg?url";
import searchEmptyLightSvg from "@/app/assets/empty-state/customers/search-empty-light.svg?url";
import { ListLayout } from "@/components/core/list";
import { ListLoaderItemRow } from "@/components/ui/loader/layouts/list-layout-loader";
// assets
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { CustomerListItem, CustomerLoader } from "@/components/customers/list";
import { useCustomers } from "@/plane-web/hooks/store";

export const CustomersListRoot = observer(function CustomersListRoot() {
  const { workspaceSlug } = useParams();
  const { resolvedTheme } = useTheme();
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { toggleCreateCustomerModal } = useCommandPalette();
  const resolvedPathSearch = resolvedTheme === "light" ? searchEmptyLightSvg : searchEmptyDarkSvg;
  const {
    customerIds,
    customerSearchQuery: searchQuery,
    fetchCustomers,
    loader,
    paginationOptions,
    fetchNextCustomers,
  } = useCustomers();

  useSWR(
    workspaceSlug ? `CUSTOMERS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchCustomers(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // derived values
  const hasWorkspaceAdminLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug.toString()
  );
  const shouldLoadMore = paginationOptions.hasNextPage;
  const isPaginating = loader === "pagination";

  const handleLoadMore = useCallback(() => {
    if (!workspaceSlug) return;
    fetchNextCustomers(workspaceSlug.toString()).catch((error) => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("customers.toasts.list.error.title"),
        message: error.error || t("customers.toasts.list.error.message"),
      });
    });
  }, [fetchNextCustomers, workspaceSlug]);

  if (!customerIds || loader === "init-loader") return <CustomerLoader />;
  /**Search empty state */
  if (searchQuery !== "" && customerIds.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <div className="text-center place-items-center">
          <img src={resolvedPathSearch} className="mx-auto h-36 w-36 sm:h-48 sm:w-48" alt="No matching customers" />
          <h5 className="mb-1 mt-7 text-18 font-medium">{t("customers.empty_state.search.title")}</h5>
          <p className="whitespace-pre-line text-14 text-placeholder flex flex-col items-center">
            {/* TODO: Translate here */}
            <span>
              Try with another search term or{" "}
              <a href="mailto:support@plane.so" className="underline">
                reach out to us
              </a>{" "}
              if you are sure you should see results for that term.
            </span>
          </p>
        </div>
      </div>
    );

  /**Empty State */
  if (customerIds.length === 0)
    return (
      <>
        <EmptyStateDetailed
          assetKey="customer"
          title={t("workspace_empty_state.customers.title")}
          description={t("workspace_empty_state.customers.description")}
          actions={[
            {
              label: t("workspace_empty_state.customers.cta_primary"),
              onClick: () => toggleCreateCustomerModal({ isOpen: true, customerId: undefined }),
              disabled: !hasWorkspaceAdminLevelPermissions,
            },
          ]}
        />
      </>
    );

  return (
    <ListLayout>
      {customerIds.map((id: string) => (
        <CustomerListItem key={id} customerId={id} workspaceSlug={workspaceSlug.toString()} />
      ))}
      {shouldLoadMore ? (
        isPaginating ? (
          <ListLoaderItemRow />
        ) : (
          <div
            className={
              "h-11 relative flex items-center gap-3 bg-surface-1 border border-transparent border-t-subtle-1 pl-8 p-3 text-13 font-medium text-accent-primary hover:text-accent-secondary hover:underline cursor-pointer"
            }
            onClick={handleLoadMore}
          >
            {t("common.load_more")} &darr;
          </div>
        )
      ) : (
        <></>
      )}
    </ListLayout>
  );
});
