"use client";
import { IssuePeekOverview } from "@/components/issues";
// plane web components
import { CustomerUpgrade } from "@/plane-web/components/customers";
import { EpicPeekOverview } from "@/plane-web/components/epics";
import { useCustomers } from "@/plane-web/hooks/store";

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  // hooks
  const { loader, isCustomersFeatureEnabled } = useCustomers();

  if (isCustomersFeatureEnabled !== undefined && isCustomersFeatureEnabled === false && loader !== "init-loader")
    return (
      <div className="h-full w-full max-w-5xl mx-auto flex items-center justify-center">
        <CustomerUpgrade />
      </div>
    );

  return (
    <>
      {children}
      <IssuePeekOverview />
      <EpicPeekOverview />
    </>
  );
}
