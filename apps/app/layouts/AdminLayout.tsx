// react
import React, { useState } from "react";
// layouts
import Container from "layouts/Container";
import Sidebar from "layouts/Navbar/Sidebar";
// components
import CreateProjectModal from "components/project/CreateProjectModal";
// types
import type { Props } from "./types";

const AdminLayout: React.FC<Props> = ({ meta, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Container meta={meta}>
      <CreateProjectModal isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="h-screen w-full flex overflow-x-hidden">
        <Sidebar />
        <main className="h-full w-full min-w-0 p-5 bg-primary overflow-y-auto">{children}</main>
      </div>
    </Container>
  );
};

export default AdminLayout;
