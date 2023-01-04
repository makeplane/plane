import React, { useEffect } from "react";
// hooks
import useUser from "lib/hooks/useUser";
// layouts
import Container from "layouts/container";
import Header from "layouts/navbar/header";
import Sidebar from "layouts/navbar/main-siderbar";
import SettingsSidebar from "layouts/navbar/settings-sidebar";
// types
import { Meta } from "./types";
import { useRouter } from "next/router";
import { NotAuthorizedView } from "components/core";
import Link from "next/link";
import { Button } from "ui";

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

// const workspaceLinks: {
//   label: string;
//   href: string;
// }[] = [
//   {
//     label: "General",
//     href: "/workspace/settings",
//   },
//   {
//     label: "Members",
//     href: "/workspace/settings/members",
//   },
// ];

const workspaceLinks: {
  label: string;
  href: string;
}[] = [
  {
    label: "General",
    href: "/workspace/settings",
  },
  {
    label: "Members",
    href: "/workspace/settings/members",
  },
  {
    label: "Features",
    href: "/workspace/settings/features",
  },
  {
    label: "Billing & Plans",
    href: "/workspace/settings/billing",
  },
];

const sidebarLinks: (pId?: string) => Array<{
  label: string;
  href: string;
}> = (projectId) => [
  {
    label: "General",
    href: `/projects/${projectId}/settings`,
  },
  {
    label: "Control",
    href: `/projects/${projectId}/settings/control`,
  },
  {
    label: "Members",
    href: `/projects/${projectId}/settings/members`,
  },
  {
    label: "States",
    href: `/projects/${projectId}/settings/states`,
  },
  {
    label: "Labels",
    href: `/projects/${projectId}/settings/labels`,
  },
];

const SettingsLayout: React.FC<Props> = (props) => {
  const { meta, children, noPadding, bg, noHeader, breadcrumbs, left, right, type, memberType } =
    props;
  const { isMember, isOwner, isViewer, isGuest } = memberType ?? {
    isMember: false,
    isOwner: false,
    isViewer: false,
    isGuest: false,
  };

  const router = useRouter();

  const { activeProject, user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && (!user || user === null)) router.push("/signin");
  }, [isUserLoading, user, router]);

  if (!isMember && !isOwner)
    return (
      <NotAuthorizedView
        actionButton={
          (isViewer || isGuest) && (
            <Button size="sm">
              <Link href={`/projects/${activeProject?.id}/issues`}>
                <a>Go to Issues</a>
              </Link>
            </Button>
          )
        }
      />
    );

  return (
    <Container meta={meta}>
      <div className="flex h-screen w-full overflow-x-hidden">
        <Sidebar />
        <SettingsSidebar
          links={type === "workspace" ? workspaceLinks : sidebarLinks(activeProject?.id)}
        />
        <main className="flex h-screen w-full min-w-0 flex-col overflow-y-auto">
          {noHeader ? null : <Header breadcrumbs={breadcrumbs} left={left} right={right} />}
          <div
            className={`w-full flex-grow ${noPadding ? "" : "px-16 pt-10 pb-5"} ${
              bg === "primary" ? "bg-primary" : bg === "secondary" ? "bg-secondary" : "bg-primary"
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </Container>
  );
};

export default SettingsLayout;
