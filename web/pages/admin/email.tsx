import { ReactElement } from "react";
// layouts
import { InstanceAdminLayout } from "layouts/admin-layout";
// types
import { NextPageWithLayout } from "types/app";

const InstanceAdminEmailPage: NextPageWithLayout = () => {
  console.log("admin page");
  return <div>Admin Email Page</div>;
};

InstanceAdminEmailPage.getLayout = function getLayout(page: ReactElement) {
  return <InstanceAdminLayout>{page}</InstanceAdminLayout>;
};

export default InstanceAdminEmailPage;
