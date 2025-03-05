import React, { FC, useCallback } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
// constants
import useSWR from "swr";
import { EUserPermissionsLevel, EUserWorkspaceRoles } from "@plane/constants";
// components
import { useTranslation } from "@plane/i18n";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
import { ListLayout } from "@/components/core/list";
import { DetailedEmptyState } from "@/components/empty-state";
// hooks
import { ListLoaderItemRow } from "@/components/ui";
import { useCommandPalette, useUserPermissions } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web components
import { CustomerListItem, CustomerLoader } from "@/plane-web/components/customers/list";
// assets
import { useCustomers } from "@/plane-web/hooks/store";
import SearchEmptyImage from "@/public/empty-state/customers/search-empty-light.svg";

export const CustomersListRoot: FC = observer(() => {
  const { workspaceSlug } = useParams();
  const resolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/customers/customers-disabled",
    extension: "png",
  });
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { toggleCreateCustomerModal } = useCommandPalette();
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
          <Image src={SearchEmptyImage} className="mx-auto h-36 w-36 sm:h-48 sm:w-48" alt="No matching customers" />
          <h5 className="mb-1 mt-7 text-xl font-medium">{t("customers.empty_state.search.title")}</h5>
          <p className="whitespace-pre-line text-base text-custom-text-400 flex flex-col items-center">
            <span>{t("customers.empty_state.search.description1")}</span>
            <span>{t("customers.empty_state.search.description2")}</span>
          </p>
          <Button className="mt-1" onClick={() => toggleCreateCustomerModal()}>
            {t("customers.empty_state.search.primary_button")}
          </Button>
        </div>
      </div>
    );

  /**Empty State */
  if (customerIds.length === 0)
    return (
      <>
        <DetailedEmptyState
          title={t("customers.empty_state.list.title")}
          description={t("customers.empty_state.list.description")}
          assetPath={resolvedPath}
          primaryButton={{
            text: t("customers.empty_state.list.primary_button"),
            disabled: !hasWorkspaceAdminLevelPermissions,
            onClick: () => toggleCreateCustomerModal({ isOpen: true, customerId: undefined }),
          }}
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
              "h-11 relative flex items-center gap-3 bg-custom-background-100 border border-transparent border-t-custom-border-200 pl-8 p-3 text-sm font-medium text-custom-primary-100 hover:text-custom-primary-200 hover:underline cursor-pointer"
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
