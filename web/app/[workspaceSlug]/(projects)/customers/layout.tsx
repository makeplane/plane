"use client";
import { observer } from "mobx-react";
import Image from "next/image";
import { EUserPermissionsLevel, EUserWorkspaceRoles } from "@plane/constants";
import { IssuePeekOverview } from "@/components/issues";
// plane web components
import { useUserPermissions } from "@/hooks/store";
import { CustomerUpgrade } from "@/plane-web/components/customers";
import { EpicPeekOverview } from "@/plane-web/components/epics";
import { useCustomers } from "@/plane-web/hooks/store";
// assets
import Unauthorized from "@/public/auth/unauthorized.svg";

const CustomersLayout = observer(({ children }: { children: React.ReactNode }) => {
  // hooks
  const { loader, isCustomersFeatureEnabled } = useCustomers();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (isCustomersFeatureEnabled !== undefined && isCustomersFeatureEnabled === false && loader !== "init-loader")
    return (
      <div className="m-auto max-w-5xl">
        <CustomerUpgrade />
      </div>
    );

  if (!isAdmin)
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-y-5 bg-custom-background-100 text-center">
        <div className="h-44 w-72">
          <Image src={Unauthorized} height="176" width="288" alt="aunauthorized" />
        </div>
        <h1 className="text-xl font-medium text-custom-text-100">{`You are not authorized to access this page.`}</h1>
      </div>
    );

  return (
    <>
      {children}
      <IssuePeekOverview />
      <EpicPeekOverview />
    </>
  );
});

export default CustomersLayout;
