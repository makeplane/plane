// react
import React, { useEffect, useState } from "react";
// next
import { useRouter } from "next/router";
// hooks
import useUser from "lib/hooks/useUser";
// layouts
import Container from "layouts/container";
import Sidebar from "layouts/navbar/main-sidebar";
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
  breadcrumbs?: JSX.Element;
  right?: JSX.Element;
  links: Array<{
    label: string;
    href: string;
  }>;
};

const SettingsLayout: React.FC<Props> = ({
  meta,
  children,
  noPadding = false,
  bg = "primary",
  breadcrumbs,
  right,
  links,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();

  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && (!user || user === null)) router.push("/signin");
  }, [isUserLoading, user, router]);

  return (
    <Container meta={meta}>
      <CreateProjectModal isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="h-screen w-full flex overflow-x-hidden">
        <Sidebar />
        <SettingsSidebar links={links} />
        <main className="h-screen w-full flex flex-col overflow-y-auto min-w-0">
          <Header breadcrumbs={breadcrumbs} right={right} />
          <div
            className={`w-full flex-grow ${noPadding ? "" : "p-5"} ${
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
