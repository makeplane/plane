import React from "react";

// layouts
import Container from "layouts/Container";

// types
import type { Props } from "./types";

const AdminLayout: React.FC<Props> = ({ meta, children }) => {
  return (
    <Container meta={meta}>
      <div className="w-full h-screen overflow-auto">
        <>{children}</>
      </div>
    </Container>
  );
};

export default AdminLayout;
