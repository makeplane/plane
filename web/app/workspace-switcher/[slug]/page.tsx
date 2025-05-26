"use client";

import React from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";

import { useTheme } from "next-themes";

// hooks
import { useUser } from "@/hooks/store";
// services
import { AuthenticationWrapper } from "@/lib/wrappers";
// images
import { WorkspacePicker } from "@/plane-web/components/integrations/ui/workspace-picker";
import BlackHorizontalLogo from "@/public/plane-logos/black-horizontal-with-blue-logo.png";
import WhiteHorizontalLogo from "@/public/plane-logos/white-horizontal-with-blue-logo.png";

const WorkspacePickerPage = observer(() => {
  // hooks
  const { data: currentUser } = useUser();
  // next-themes
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === "light" ? BlackHorizontalLogo : WhiteHorizontalLogo;

  return (
    <AuthenticationWrapper>
      <div className="flex flex-col h-full gap-y-2 pb-20">
        <div className="flex items-center justify-between p-10 lg:px-20 xl:px-36">
          <Link href="/" className="bg-custom-background-100 px-3">
            <div className="h-[30px] w-[133px]">
              <Image src={logo} alt="Plane logo" />
            </div>
          </Link>
          <div className="text-sm text-custom-text-100">{currentUser?.email}</div>
        </div>
        <WorkspacePicker />
      </div>
    </AuthenticationWrapper>
  );
});

export default WorkspacePickerPage;
