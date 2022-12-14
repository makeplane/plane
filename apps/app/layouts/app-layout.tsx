import React, { useState } from "react";
// layouts
import Container from "layouts/Container";
import Sidebar from "layouts/Navbar/main-sidebar";
import Header from "layouts/Navbar/Header";
// components
import CreateProjectModal from "components/project/create-project-modal";
// types
import type { Props } from "./types";

const AppLayout: React.FC<Props> = ({
  meta,
  children,
  noPadding = false,
  bg = "primary",
  breadcrumbs,
  right,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Container meta={meta}>
      <CreateProjectModal isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="h-screen w-full flex overflow-x-hidden">
        <Sidebar />
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

export default AppLayout;
