"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";

type TTemplatesLayout = {
  children: ReactNode;
};

const TemplatesLayout: FC<TTemplatesLayout> = observer((props) => {
  const { children } = props;
  // router params
  const { workspaceSlug } = useParams();

  return (
    <SettingsContentWrapper>
      <div className="w-full h-full">
        <Link
          href={`/${workspaceSlug}/settings/templates`}
          className="flex items-center gap-2 text-sm font-semibold text-custom-text-300 mb-6"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back to templates
        </Link>
        {children}
      </div>
    </SettingsContentWrapper>
  );
});

export default TemplatesLayout;
