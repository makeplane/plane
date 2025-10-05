"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CommandPaletteV2ModalWrapper } from "@/components/power-k";
import { useUser } from "@/hooks/store/user";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
// plane web components
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";
import { ProjectAppSidebar } from "./_sidebar";

const WorkspaceLayoutContent = observer(({ children }: { children: React.ReactNode }) => {
  const { workspaceSlug, projectId } = useParams();
  const { data: currentUser } = useUser();

  return (
    <>
      <CommandPaletteV2ModalWrapper
        workspaceSlug={workspaceSlug?.toString()}
        projectId={projectId?.toString()}
        currentUserId={currentUser?.id}
        canPerformAnyCreateAction
        canPerformWorkspaceActions
        canPerformProjectActions
      />
      <WorkspaceAuthWrapper>
        <div className="relative flex flex-col h-full w-full overflow-hidden rounded-lg border border-custom-border-200">
          <div id="full-screen-portal" className="inset-0 absolute w-full" />
          <div className="relative flex size-full overflow-hidden">
            <ProjectAppSidebar />
            <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
              {children}
            </main>
          </div>
        </div>
      </WorkspaceAuthWrapper>
    </>
  );
});

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticationWrapper>
      <WorkspaceLayoutContent>{children}</WorkspaceLayoutContent>
    </AuthenticationWrapper>
  );
}
