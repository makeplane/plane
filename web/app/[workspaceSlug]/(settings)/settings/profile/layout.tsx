"use client";

import { ReactNode } from "react";
import { useParams, usePathname } from "next/navigation";
// components
import { CommandPalette } from "@/components/command-palette";
import { SettingsContentWrapper } from "@/components/settings";
import { ProfileSidebar } from "./sidebar";

type Props = {
  children: ReactNode;
};

export default function ProfileSettingsLayout(props: Props) {
  const { children } = props;
  // router
  const pathname = usePathname();
  const { workspaceSlug } = useParams();

  return (
    <>
      <CommandPalette />
      <div className="relative flex h-full w-full">
        <ProfileSidebar workspaceSlug={workspaceSlug.toString()} pathname={pathname} />
        <SettingsContentWrapper>{children}</SettingsContentWrapper>
      </div>
    </>
  );
}
