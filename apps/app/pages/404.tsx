import React from "react";

import Link from "next/link";
import Image from "next/image";

// layouts
import DefaultLayout from "layouts/default-layout";
// ui
import { SecondaryButton } from "components/ui";
// images
import Image404 from "public/404.svg";
// types
import type { NextPage } from "next";

const PageNotFound: NextPage = () => (
  <DefaultLayout
    meta={{
      title: "Plane - Page Not Found",
      description: "Page Not Found",
    }}
  >
    <div className="grid h-full place-items-center p-4">
      <div className="space-y-8 text-center">
        <div className="relative mx-auto h-60 w-60 lg:h-80 lg:w-80">
          <Image src={Image404} layout="fill" alt="404- Page not found" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Oops! Something went wrong.</h3>
          <p className="text-sm text-gray-500">
            Sorry, the page you are looking for cannot be found. It may have been removed, had its
            name changed, or is temporarily unavailable.
          </p>
        </div>
        <Link href="/">
          <a className="block">
            <SecondaryButton size="md">Go to Home</SecondaryButton>
          </a>
        </Link>
      </div>
    </div>
  </DefaultLayout>
);

export default PageNotFound;
