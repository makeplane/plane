"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SILO_BASE_URL, SILO_BASE_PATH } from "@plane/constants";
// hooks
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser } from "@/hooks/store/user";

type TImporterLayout = {
  children: ReactNode;
};

const ImporterLayout: FC<TImporterLayout> = observer((props) => {
  const { children } = props;

  // router params
  const { workspaceSlug: workspaceSlugParam } = useParams();

  // hooks
  const { currentWorkspace } = useWorkspace();
  const { data: currentUser } = useUser();

  // derived values
  const siloBaseUrl = encodeURI(SILO_BASE_URL + SILO_BASE_PATH) || undefined;
  const workspaceSlug = workspaceSlugParam?.toString() || undefined;
  const workspaceId = currentWorkspace?.id || undefined;
  const userId = currentUser?.id || undefined;

  // check if workspace exists
  if (!workspaceSlug || !workspaceId || !userId || !siloBaseUrl) return null;

  return (
    <SettingsContentWrapper size="lg">
      <Link
        href={`/${workspaceSlug}/settings/imports`}
        className="flex items-center gap-2 text-sm text-custom-text-300 font-semibold pb-4"
      >
        <ChevronLeft className="size-4" />
        <span>Back to Imports</span>
      </Link>
      {children}
    </SettingsContentWrapper>
  );
});

export default ImporterLayout;
