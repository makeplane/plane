import React from "react";
import { Link } from "react-router";
// ui
import { Button } from "@plane/propel/button";
// images
import Image404 from "@/app/assets/images/404.svg?url";

const PageNotFound = () => (
  <div className={`h-screen w-full overflow-hidden bg-custom-background-100`}>
    <div className="grid h-full place-items-center p-4">
      <div className="space-y-8 text-center">
        <div className="relative mx-auto h-60 w-60 lg:h-80 lg:w-80">
          <img src={Image404} alt="404 - Page not found" className="h-full w-full object-contain" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Oops! Something went wrong.</h3>
          <p className="text-sm text-custom-text-200">
            Sorry, the page you are looking for cannot be found. It may have been removed, had its name changed, or is
            temporarily unavailable.
          </p>
        </div>
        <Link to="/general/">
          <span className="flex justify-center py-4">
            <Button variant="neutral-primary" size="md">
              Go to general settings
            </Button>
          </span>
        </Link>
      </div>
    </div>
  </div>
);

export default PageNotFound;
