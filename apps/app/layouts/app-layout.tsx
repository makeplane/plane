import React, { useState } from "react";
// layouts
import Container from "layouts/container";
import Sidebar from "layouts/navbar/main-siderbar";
import Header from "layouts/navbar/header";
// components
import { CreateProjectModal } from "components/project";
import CommandPalette from "components/command-palette";
// types
import type { Props } from "./types";

const AppLayout: React.FC<Props> = ({
  meta,
  children,
  noPadding = false,
  bg = "primary",
  noHeader = false,
  breadcrumbs,
  left,
  right,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Container meta={meta}>
      <CommandPalette />
      <CreateProjectModal isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="flex h-screen w-full overflow-x-hidden">
        <Sidebar />
        <main className="flex h-screen w-full min-w-0 flex-col overflow-y-auto">
          {noHeader ? null : <Header breadcrumbs={breadcrumbs} left={left} right={right} />}
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
