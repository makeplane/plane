import React, { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// layouts
import Container from "layouts/container";
import Header from "layouts/navbar/header";
import Sidebar from "layouts/navbar/main-sidebar";
import SettingsSidebar from "layouts/navbar/settings-sidebar";
// components
import { NotAuthorizedView } from "components/core";
import CommandPalette from "components/command-palette";
// ui
import { Button } from "components/ui";
// types
import { Meta } from "./types";
import AppSidebar from "./app-layout/app-sidebar";

type Props = {
  meta?: Meta;
  children: React.ReactNode;
  noPadding?: boolean;
  bg?: "primary" | "secondary";
  noHeader?: boolean;
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
  type: "workspace" | "project";
  memberType?: {
    isMember: boolean;
    isOwner: boolean;
    isViewer: boolean;
    isGuest: boolean;
  };
};

const workspaceLinks: (wSlug: string) => Array<{
  label: string;
  href: string;
}> = (workspaceSlug) => [
  {
    label: "General",
    href: `/${workspaceSlug}/settings`,
  },
  {
    label: "Members",
    href: `/${workspaceSlug}/settings/members`,
  },
  {
    label: "Features",
    href: `/${workspaceSlug}/settings/features`,
  },
  {
    label: "Billing & Plans",
    href: `/${workspaceSlug}/settings/billing`,
  },
];

const sidebarLinks: (
  wSlug?: string,
  pId?: string
) => Array<{
  label: string;
  href: string;
}> = (workspaceSlug, projectId) => [
  {
    label: "General",
    href: `/${workspaceSlug}/projects/${projectId}/settings`,
  },
  {
    label: "Control",
    href: `/${workspaceSlug}/projects/${projectId}/settings/control`,
  },
  {
    label: "Members",
    href: `/${workspaceSlug}/projects/${projectId}/settings/members`,
  },
  {
    label: "States",
    href: `/${workspaceSlug}/projects/${projectId}/settings/states`,
  },
  {
    label: "Labels",
    href: `/${workspaceSlug}/projects/${projectId}/settings/labels`,
  },
];

const SettingsLayout: React.FC<Props> = ({
  meta,
  children,
  noPadding,
  bg,
  noHeader,
  breadcrumbs,
  left,
  right,
  type,
  memberType,
}) => {
  const [toggleSidebar, setToggleSidebar] = useState(false);

  const { isMember, isOwner, isViewer, isGuest } = memberType ?? {
    isMember: false,
    isOwner: false,
    isViewer: false,
    isGuest: false,
  };

  const {
    query: { workspaceSlug, projectId },
  } = useRouter();

  return (
    <Container meta={meta}>
      <div className="flex h-screen w-full overflow-x-hidden">
        <AppSidebar toggleSidebar={toggleSidebar} setToggleSidebar={setToggleSidebar} />
        <CommandPalette />
        {isMember || isOwner ? (
          <>
            <SettingsSidebar
              links={
                type === "workspace"
                  ? workspaceLinks(workspaceSlug as string)
                  : sidebarLinks(workspaceSlug as string, projectId as string)
              }
            />
            <main className="flex h-screen w-full min-w-0 flex-col overflow-y-auto">
              {noHeader ? null : (
                <Header
                  breadcrumbs={breadcrumbs}
                  left={left}
                  right={right}
                  setToggleSidebar={setToggleSidebar}
                />
              )}
              <div
                className={`w-full flex-grow ${noPadding ? "" : "p-5 pb-5 lg:px-16 lg:pt-10"} ${
                  bg === "primary"
                    ? "bg-primary"
                    : bg === "secondary"
                    ? "bg-secondary"
                    : "bg-primary"
                }`}
              >
                {children}
              </div>
            </main>
          </>
        ) : (
          <NotAuthorizedView
            actionButton={
              (isViewer || isGuest) && projectId ? (
                <Link href={`/${workspaceSlug}/projects/${projectId}/issues`}>
                  <Button size="sm" theme="secondary">
                    Go to Issues
                  </Button>
                </Link>
              ) : (
                (isViewer || isGuest) &&
                workspaceSlug && (
                  <Link href={`/${workspaceSlug}`}>
                    <Button size="sm" theme="secondary">
                      Go to workspace
                    </Button>
                  </Link>
                )
              )
            }
          />
        )}
      </div>
    </Container>
  );
};

export default SettingsLayout;
