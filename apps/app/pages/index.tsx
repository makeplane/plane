import { useEffect } from "react";
import { homePageRedirect } from "lib/auth";
// types
import type { NextPage, NextPageContext } from "next";
import { useRouter } from "next/router";

const Home: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/onboarding");
  }, []);
  return <>loading</>;
};
export default Home;
