import Link from "next/link";
// ui
import { Button } from "@plane/propel/button";
// images
import Image404 from "@/app/assets/404.svg?url";
// types
import type { Route } from "./+types/not-found";

export const meta: Route.MetaFunction = () => [
  { title: "404 - Page Not Found" },
  { name: "robots", content: "noindex, nofollow" },
];

function PageNotFound() {
  return (
    <div className={`h-screen w-full overflow-hidden bg-surface-1`}>
      <div className="grid h-full place-items-center p-4">
        <div className="space-y-8 text-center">
          <div className="relative mx-auto h-60 w-60 lg:h-80 lg:w-80">
            <img src={Image404} className="h-full w-full object-contain" alt="404- Page not found" />
          </div>
          <div className="space-y-2">
            <h3 className="text-16 font-semibold">Oops! Something went wrong.</h3>
            <p className="text-13 text-secondary">
              Sorry, the page you are looking for cannot be found. It may have been removed, had its name changed, or is
              temporarily unavailable.
            </p>
          </div>
          <Link href="/">
            <span className="flex justify-center">
              <Button variant="secondary" size="lg">
                Go to Home
              </Button>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PageNotFound;
