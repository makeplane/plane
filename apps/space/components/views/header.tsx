import React from "react";
import { Link } from "react-router";
import { PlaneLockup } from "@plane/propel/icons";

export function AuthHeader() {
  return (
    <div className="sticky top-0 flex w-full flex-shrink-0 items-center justify-between gap-6">
      <Link to="/">
        <PlaneLockup height={20} width={95} className="text-primary" />
      </Link>
    </div>
  );
}
