import { ReactElement } from "react";
// layouts
import { SignUpView } from "@/components/page-views";
import DefaultLayout from "@/layouts/default-layout";
// components
// type
import { NextPageWithLayout } from "@/lib/types";

const HomePage: NextPageWithLayout = () => <SignUpView />;

HomePage.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};

export default HomePage;
