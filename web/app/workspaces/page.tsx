"use client";

import React from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";

import { useTheme } from "next-themes";

// hooks
import { useTranslation } from "@plane/i18n";
import { WorkspacePicker } from "@/components/common/workspace-picker";
import { useUser } from "@/hooks/store";
// services
import { AuthenticationWrapper } from "@/lib/wrappers";
// images
import BlackHorizontalLogo from "@/public/plane-logos/black-horizontal-with-blue-logo.png";
import WhiteHorizontalLogo from "@/public/plane-logos/white-horizontal-with-blue-logo.png";

const WorkspacePickerPage = observer(() => {
  // hooks
  const { t } = useTranslation();
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
        <div className="relative flex flex-col gap-4 h-full w-full justify-center px-8 pb-8 items-center">
          <div className="text-3xl font-bold text-center">{t("choose_workspace_for_integration")}</div>
          <div className="font-medium text-custom-text-300 max-w-[450px] text-center">
            {t("integrations_description")}
          </div>
          <div className="overflow-y-auto vertical-scrollbar scrollbar-sm mb-10 w-full md:w-fit">
            <WorkspacePicker />
          </div>
        </div>
      </div>
    </AuthenticationWrapper>
  );
});

export default WorkspacePickerPage;
