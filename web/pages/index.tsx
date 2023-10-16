import type { NextPage } from "next";
// layouts
import DefaultLayout from "layouts/default-layout";
// components
import { SignInView } from "components/page-views";

const HomePage: NextPage = () => (
  <DefaultLayout>
    <SignInView />
  </DefaultLayout>
);

export default HomePage;
