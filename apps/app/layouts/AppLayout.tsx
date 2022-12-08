// react
import React, { useEffect, useState } from "react";
// next
import { useRouter } from "next/router";
// hooks
import useUser from "lib/hooks/useUser";
// layouts
import Container from "layouts/Container";
import Sidebar from "layouts/Navbar/Sidebar";
// components
import CreateProjectModal from "components/project/CreateProjectModal";
// types
import type { Props } from "./types";

const AppLayout: React.FC<Props> = ({ meta, children, noPadding = false, bg = "primary" }) => {
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
        <main
          className={`h-full w-full min-w-0 overflow-y-auto ${noPadding ? "" : "p-5"} ${
            bg === "primary" ? "bg-primary" : bg === "secondary" ? "bg-secondary" : "bg-primary"
          }`}
        >
          {children}
        </main>
      </div>
    </Container>
  );
};

export default AppLayout;
