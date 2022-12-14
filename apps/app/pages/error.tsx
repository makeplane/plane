import React from "react";

import type { NextPage } from "next";

// layouts
import DefaultLayout from "layouts/default-layout";

const ErrorPage: NextPage = () => {
  return (
    <DefaultLayout
      meta={{
        title: "Plane - An error occurred",
        description: "We were unable to get this page for you.",
      }}
    >
      <div className="h-full w-full">
        <h2 className="text-3xl">Error!</h2>
      </div>
    </DefaultLayout>
  );
};

export default ErrorPage;
