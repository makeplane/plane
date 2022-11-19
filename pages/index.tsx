import React, { useEffect } from "react";
// next
import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// hooks
import useUser from "lib/hooks/useUser";
// fetch keys
import { USER_ISSUE } from "constants/fetch-keys";
// services
import userService from "lib/services/user.service";
// ui
import { Spinner } from "ui";
// icons
import { ArrowRightIcon } from "@heroicons/react/24/outline";
// types
import type { IIssue } from "types";
import ProjectLayout from "layouts/ProjectLayout";

const Home: NextPage = () => {
  const router = useRouter();

  const { user, isUserLoading, activeWorkspace, projects, workspaces } = useUser();

  const { data: myIssues } = useSWR<IIssue[]>(
    user ? USER_ISSUE : null,
    user ? () => userService.userIssues() : null
  );

  if (!isUserLoading && !user) router.push("/signin");

  useEffect(() => {
    if (!activeWorkspace && workspaces?.length === 0) router.push("/invitations");
    else if (activeWorkspace) router.push(`/workspace/`);
  }, [activeWorkspace, router, workspaces]);

  return <></>;
};

export default Home;
