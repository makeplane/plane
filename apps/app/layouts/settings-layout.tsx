// react
import React, { useEffect, useState } from "react";
// next
import { useRouter } from "next/router";
// hooks
import useUser from "lib/hooks/useUser";
// layouts
import Container from "layouts/container";
import Sidebar from "layouts/navbar/main-siderbar";
import SettingsSidebar from "layouts/navbar/settings-sidebar";
import Header from "layouts/navbar/header";
// components
import CreateProjectModal from "components/project/create-project-modal";
// types
import { Meta } from "./types";

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
};

const SettingsLayout: React.FC<Props> = ({
  meta,
  children,
  noPadding = false,
  bg = "primary",
  noHeader = false,
  breadcrumbs,
  left,
  right,
  type,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();

  const { activeWorkspace, activeProject, user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && (!user || user === null)) router.push("/signin");
  }, [isUserLoading, user, router]);

  const workspaceLinks: {
    label: string;
    href: string;
  }[] = [
    {
      label: "General",
      href: "#",
    },
    {
      label: "Control",
      href: "#",
    },
    {
      label: "States",
      href: "#",
    },
    {
      label: "Labels",
      href: "#",
    },
  ];

  const sidebarLinks: {
    label: string;
    href: string;
  }[] = [
    {
      label: "General",
      href: `/projects/${activeProject?.id}/settings`,
    },
    {
      label: "Control",
      href: `/projects/${activeProject?.id}/settings/control`,
    },
    {
      label: "Members",
      href: `/projects/${activeProject?.id}/settings/members`,
    },
    {
      label: "States",
      href: `/projects/${activeProject?.id}/settings/states`,
    },
    {
      label: "Labels",
      href: `/projects/${activeProject?.id}/settings/labels`,
    },
  ];

  return (
    <Container meta={meta}>
      <CreateProjectModal isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="h-screen w-full flex overflow-x-hidden">
        <Sidebar collapse />
        <SettingsSidebar links={type === "workspace" ? workspaceLinks : sidebarLinks} />
        <main className="h-screen w-full flex flex-col overflow-y-auto min-w-0">
          {noHeader ? null : <Header breadcrumbs={breadcrumbs} left={left} right={right} />}
          <div
            className={`w-full flex-grow ${noPadding ? "" : "p-5 px-16"} ${
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
