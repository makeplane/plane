import { ReactElement } from "react";
// layouts
import { InstanceAdminLayout } from "layouts/admin-layout";
// types
import { NextPageWithLayout } from "types/app";

const InstanceAdminAIPage: NextPageWithLayout = () => {
  console.log("admin page");
  return <div>Admin AI Page</div>;
};

InstanceAdminAIPage.getLayout = function getLayout(page: ReactElement) {
  return <InstanceAdminLayout>{page}</InstanceAdminLayout>;
};

export default InstanceAdminAIPage;
