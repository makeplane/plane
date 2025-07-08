"use client";
import { observer } from "mobx-react";
import { IssuePeekOverview } from "@/components/issues";
// plane web components
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";
import { CustomerUpgrade } from "@/plane-web/components/customers";
import { EpicPeekOverview } from "@/plane-web/components/epics";
import { useCustomers } from "@/plane-web/hooks/store";

const CustomersLayout = observer(({ children }: { children: React.ReactNode }) => {
  // hooks
  const { loader, isCustomersFeatureEnabled } = useCustomers();
  // derived values
  const shouldUpgrade =
    isCustomersFeatureEnabled !== undefined && isCustomersFeatureEnabled === false && loader !== "init-loader";

  return (
    <WorkspaceAccessWrapper pageKey="customers">
      {shouldUpgrade ? (
        <div className="h-full w-full max-w-5xl mx-auto flex items-center justify-center">
          <CustomerUpgrade />
        </div>
      ) : (
        <>
          {children}
          <IssuePeekOverview />
          <EpicPeekOverview />
        </>
      )}
    </WorkspaceAccessWrapper>
  );
});

export default CustomersLayout;
