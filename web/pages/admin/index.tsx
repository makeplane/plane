import { ReactElement } from "react";
// layouts
import { InstanceAdminLayout } from "layouts/admin-layout";
// types
import { NextPageWithLayout } from "types/app";

const InstanceAdminPage: NextPageWithLayout = () => {
  console.log("admin page");
  return <div>Admin Page</div>;
};

InstanceAdminPage.getLayout = function getLayout(page: ReactElement) {
  return <InstanceAdminLayout>{page}</InstanceAdminLayout>;
};

export default InstanceAdminPage;
