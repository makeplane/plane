import React from "react";

// layouts
import DefaultLayout from "layouts/default-layout";
// types
import type { NextPage } from "next";

const ErrorPage: NextPage = () => (
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

export default ErrorPage;
