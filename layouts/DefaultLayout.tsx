import React from "react";

// layouts
import Container from "layouts/Container";
import DefaultTopBar from "layouts/Navbar/DefaultTopBar";

// types
import type { Props } from "./types";

const DefaultLayout: React.FC<Props> = ({ meta, children }) => {
  return (
    <Container meta={meta}>
      <div className="w-full h-screen overflow-auto bg-gray-50">
        {/* <DefaultTopBar /> */}
        <>{children}</>
      </div>
    </Container>
  );
};

export default DefaultLayout;
