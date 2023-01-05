import React, { useEffect } from "react";
// next
import type { NextPage } from "next";
import { useRouter } from "next/router";
// hooks
import useUser from "lib/hooks/useUser";

const Home: NextPage = () => {
  const router = useRouter();

  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && (!user || user === null)) router.push("/signin");
    else router.push("/home");
  }, [isUserLoading, user, router]);

  return <></>;
};

export default Home;
