import { ReactElement } from "react";
// layouts
import DefaultLayout from "layouts/default-layout";
// components
import { InstanceSetupView } from "components/page-views";
// type
import { NextPageWithLayout } from "types/app";

const GodMode: NextPageWithLayout = () => <InstanceSetupView />;

GodMode.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};

export default GodMode;
