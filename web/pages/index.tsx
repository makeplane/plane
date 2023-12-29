import { ReactElement } from "react";
// layouts
import DefaultLayout from "layouts/default-layout";
// components
import { SignInView } from "components/page-views";
// type
import { NextPageWithLayout } from "lib/types";

const HomePage: NextPageWithLayout = () => <SignInView />;

HomePage.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};

export default HomePage;
