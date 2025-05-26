"use client";

import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
// ui
import { Button } from "@plane/ui";
// images
import Image404 from "@/public/404.svg";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  robots: {
    index: false,
    follow: false,
  },
};

const PageNotFound = () => (
  <div className={`h-screen w-full overflow-hidden bg-custom-background-100`}>
    <div className="grid h-full place-items-center p-4">
      <div className="space-y-8 text-center">
        <div className="relative mx-auto h-60 w-60 lg:h-80 lg:w-80">
          <Image src={Image404} layout="fill" alt="404- Page not found" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Oops! Something went wrong.</h3>
          <p className="text-sm text-custom-text-200">
            Sorry, the page you are looking for cannot be found. It may have been removed, had its name changed, or is
            temporarily unavailable.
          </p>
        </div>
        <Link href="/">
          <span className="flex justify-center">
            <Button variant="neutral-primary" size="md">
              Go to Home
            </Button>
          </span>
        </Link>
      </div>
    </div>
  </div>
);

export default PageNotFound;
