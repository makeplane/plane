import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";

import useSWR, { mutate } from "swr";

// next-themes
import { useTheme } from "next-themes";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout-legacy";
// services
import userService from "services/user.service";
// hooks
import useUser from "hooks/use-user";
import useProjects from "hooks/use-projects";
// components
import { CompletedIssuesGraph, IssuesList, IssuesPieChart, IssuesStats } from "components/workspace";
import { TourRoot } from "components/onboarding";
// ui
import { PrimaryButton, ProductUpdatesModal } from "components/ui";
// icons
import { BoltOutlined, GridViewOutlined } from "@mui/icons-material";
// images
import emptyDashboard from "public/empty-state/dashboard.svg";
import githubBlackImage from "/public/logos/github-black.png";
import githubWhiteImage from "/public/logos/github-white.png";
// types
import { IUser } from "types";
import type { NextPage } from "next";
// fetch-keys
import { CURRENT_USER, USER_WORKSPACE_DASHBOARD } from "constants/fetch-keys";
import { AppLayout } from "layouts/app-layout";
import { WorkspaceDashboardView } from "components/views";

const WorkspacePage: NextPage = () => {
  // states
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [isProductUpdatesModalOpen, setIsProductUpdatesModalOpen] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // theme
  const { theme } = useTheme();

  // const { user } = useUser();
  // const { projects } = useProjects();

  // const { data: workspaceDashboardData } = useSWR(
  //   workspaceSlug ? USER_WORKSPACE_DASHBOARD(workspaceSlug as string) : null,
  //   workspaceSlug ? () => userService.userWorkspaceDashboard(workspaceSlug as string, month) : null
  // );

  // useEffect(() => {
  //   if (!workspaceSlug) return;

  //   mutate(USER_WORKSPACE_DASHBOARD(workspaceSlug as string));
  // }, [month, workspaceSlug]);

  return (
    <AppLayout>
      <WorkspaceDashboardView />
    </AppLayout>
  );
};

export default WorkspacePage;
