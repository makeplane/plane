import React, { useEffect } from "react";
// next
import type { NextPage } from "next";
import { useRouter } from "next/router";
// hooks
import useUser from "lib/hooks/useUser";

const Home: NextPage = () => {
  const router = useRouter();

  const { user, isUserLoading, activeWorkspace, workspaces } = useUser();

  if (!isUserLoading && !user) router.push("/signin");

  useEffect(() => {
    if (!activeWorkspace && workspaces?.length === 0) router.push("/invitations");
    else if (activeWorkspace) router.push(`/workspace/`);
  }, [activeWorkspace, router, workspaces]);

  return <></>;
};

export default Home;
