"use client";
import { PageHead } from "@/components/core";
import { useWorkspace } from "@/hooks/store";
// plane web components
import { CustomersListRoot } from "@/plane-web/components/customers/list";

const CustomersListPage = () => {
  // store
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Customers` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <CustomersListRoot />;
    </>
  );
};

export default CustomersListPage;
