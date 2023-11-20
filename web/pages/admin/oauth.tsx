import { ReactElement } from "react";
// layouts
import { InstanceAdminLayout } from "layouts/admin-layout";
// types
import { NextPageWithLayout } from "types/app";

const InstanceAdminOAuthPage: NextPageWithLayout = () => {
  console.log("admin page");
  return <div>Admin oauth Page</div>;
};

InstanceAdminOAuthPage.getLayout = function getLayout(page: ReactElement) {
  return <InstanceAdminLayout>{page}</InstanceAdminLayout>;
};

export default InstanceAdminOAuthPage;
