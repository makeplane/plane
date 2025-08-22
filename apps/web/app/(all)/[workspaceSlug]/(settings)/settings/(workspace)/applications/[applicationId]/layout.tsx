"use client";
import Link from "next/link";

import { useParams } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

const ApplicationLayout = ({ children }: { children: React.ReactNode }) => {
  const { workspaceSlug } = useParams();
  return (
    <div className="w-full h-full">
      <Link
        href={`/${workspaceSlug}/settings/applications`}
        className="flex items-center gap-2 text-sm font-semibold text-custom-text-300 mb-6"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Back to applications
      </Link>
      {children}
    </div>
  );
};

export default ApplicationLayout;
