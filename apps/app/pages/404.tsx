import React from "react";

import type { NextPage } from "next";

// layouts
import DefaultLayout from "layouts/DefaultLayout";

const PageNotFound: NextPage = () => {
  return (
    <DefaultLayout
      meta={{
        title: "Plane - Page Not Found",
        description: "Page Not Found",
      }}
    >
      <div className="relative flex h-full w-full flex-col items-center justify-center text-center">
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-200"></div>
        <div className="z-10 text-2xl font-medium tracking-widest">Not Found</div>
        <div className="z-10 text-9xl font-bold">404</div>
        <div className="z-10 mt-10 text-2xl">
          Oops! Something went wrong. Sorry, Please recheck the URL and try again.
        </div>
        <p className="z-10 mt-3 w-full md:w-1/2">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis, impedit ex. Unde, ratione
          odio laudantium molestiae sunt architecto laboriosam ex.
        </p>
      </div>
    </DefaultLayout>
  );
};

export default PageNotFound;
