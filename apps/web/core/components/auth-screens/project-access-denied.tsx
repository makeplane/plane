"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// plane imports
import { Button } from "@plane/propel/button";

export const ProjectAccessDenied = observer(function ProjectAccessDenied() {
  const { workspaceSlug } = useParams();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-subtle">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-danger-primary"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="mt-2 text-h4-medium text-primary">Access Denied</h2>
        <p className="max-w-md text-body-sm-regular text-secondary">
          You don&apos;t have access to this project. Please contact your workspace admin to request access.
        </p>
      </div>
      <Link href={`/${workspaceSlug}`}>
        <Button variant="primary" size="lg">
          Go to Workspace
        </Button>
      </Link>
    </div>
  );
});
