import React, { useState } from "react";
// components
import CreateProjectModal from "components/project/CreateProjectModal";
// layouts
import AdminLayout from "layouts/AdminLayout";
// types
import type { Props } from "./types";
// components
import Sidebar from "./Navbar/Sidebar";

const ProjectLayouts: React.FC<Props> = ({ children, meta }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AdminLayout meta={meta}>
      <CreateProjectModal isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="h-full w-full overflow-x-hidden relative flex">
        <Sidebar />
        <main className="h-full w-full mx-auto min-w-0 pb-6 overflow-y-hidden">
          <div className="h-full w-full px-8 py-6 overflow-auto">{children}</div>
        </main>
      </div>
    </AdminLayout>
  );
};

export default ProjectLayouts;
