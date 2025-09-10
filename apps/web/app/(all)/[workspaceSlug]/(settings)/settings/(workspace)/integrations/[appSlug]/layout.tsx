"use client";
import Link from "next/link";

import { useParams } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

const IntegrationLayout = ({ children }: { children: React.ReactNode }) => {
  const { workspaceSlug } = useParams();
  return (
    <div className="w-full h-full">
      <Link
        href={`/${workspaceSlug}/settings/integrations`}
        className="flex items-center gap-2 text-sm font-semibold text-custom-text-300 mb-6"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Back to integrations
      </Link>
      {children}
    </div>
  );
};

export default IntegrationLayout;
