import React, { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane web components
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
import { Loader } from "@plane/ui";
import { PageHead } from "@/components/core/page-title";
import { useUserPermissions } from "@/hooks/store/user"
import { useWorkspace } from "@/hooks/store/use-workspace";
import { CustomerDetailSidebar, CustomerEmptyState, CustomerMainRoot } from "@/plane-web/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";
import { LayoutRoot } from "../../common";

export const CustomerDetailRoot: FC = observer(() => {
  const { workspaceSlug, customerId } = useParams();

  // hooks
  const { currentWorkspace } = useWorkspace();
  const { fetchCustomerDetails } = useCustomers();
  const { allowPermissions } = useUserPermissions();

  const { data: customer, isLoading } = useSWR(
    workspaceSlug && customerId ? `CUSTOMER_DETAIL_${workspaceSlug}_${customerId}` : null,
    workspaceSlug && customerId ? () => fetchCustomerDetails(workspaceSlug.toString(), customerId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // derived values
  const isEditable = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle =
    currentWorkspace?.name && customer?.name ? `${currentWorkspace.name} - ${customer.name}` : undefined;

  return isLoading ? (
    <Loader className="flex h-full gap-5 p-5">
      <div className="basis-2/3 space-y-2">
        <Loader.Item height="30px" width="40%" />
        <Loader.Item height="15px" width="60%" />
        <Loader.Item height="15px" width="60%" />
        <Loader.Item height="15px" width="40%" />
      </div>
      <div className="basis-1/3 space-y-3">
        <Loader.Item height="30px" />
        <Loader.Item height="30px" />
        <Loader.Item height="30px" />
        <Loader.Item height="30px" />
      </div>
    </Loader>
  ) : (
    <>
      <PageHead title={pageTitle} />
      <LayoutRoot
        renderEmptyState={!customer}
        emptyStateComponent={<CustomerEmptyState workspaceSlug={workspaceSlug.toString()} />}
      >
        <CustomerMainRoot
          customerId={customerId.toString()}
          workspaceSlug={workspaceSlug.toString()}
          isEditable={isEditable}
        />
        <CustomerDetailSidebar
          customerId={customerId.toString()}
          workspaceSlug={workspaceSlug.toString()}
          isDisabled={!isEditable}
        />
      </LayoutRoot>
    </>
  );
});
