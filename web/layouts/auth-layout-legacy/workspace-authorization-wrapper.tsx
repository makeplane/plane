import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { WorkspaceService } from "services/workspace.service";
// contexts
import { WorkspaceMemberProvider } from "contexts/workspace-member.context";
// layouts
import AppSidebar from "layouts/app-layout-legacy/app-sidebar";
import AppHeader from "layouts/app-layout-legacy/app-header";
import { UserAuthorizationLayout } from "./user-authorization-wrapper";
// components
import { Button, Spinner } from "@plane/ui";
import { NotAuthorizedView, NotAWorkspaceMember } from "components/auth-screens";
import { CommandPalette } from "components/command-palette";
// icons
import { LayerDiagonalIcon } from "components/icons";
// fetch-keys
import { WORKSPACE_MEMBERS_ME } from "constants/fetch-keys";

type Props = {
  children: React.ReactNode;
  noHeader?: boolean;
  bg?: "primary" | "secondary";
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
};

const workspaceService = new WorkspaceService();

export const WorkspaceAuthorizationLayout: React.FC<Props> = ({
  children,
  noHeader = false,
  bg = "primary",
  breadcrumbs,
  left,
  right,
}) => {
  const [toggleSidebar, setToggleSidebar] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: workspaceMemberMe, error } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS_ME(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.workspaceMemberMe(workspaceSlug.toString()) : null
  );

  if (!workspaceMemberMe && !error)
    return (
      <div className="grid h-screen place-items-center p-4 bg-custom-background-100">
        <div className="flex flex-col items-center gap-3 text-center">
          <h3 className="text-xl">Loading your workspace...</h3>
          <Spinner />
        </div>
      </div>
    );

  if (error?.status === 401 || error?.status === 403) return <NotAWorkspaceMember />;

  // FIXME: show 404 for workspace not workspace member
  if (error?.status === 404) {
    return (
      <div className="container flex h-screen items-center justify-center bg-custom-background-100">
        <p className="text-2xl font-semibold">No such workspace exists. Create one?</p>
      </div>
    );
  }

  const settingsLayout = router.pathname.includes("/settings");
  const memberType = {
    isOwner: workspaceMemberMe?.role === 20,
    isMember: workspaceMemberMe?.role === 15,
    isViewer: workspaceMemberMe?.role === 10,
    isGuest: workspaceMemberMe?.role === 5,
  };

  return (
    <UserAuthorizationLayout>
      <WorkspaceMemberProvider>
        <CommandPalette />
        <div className="relative flex h-screen w-full overflow-hidden">
          <AppSidebar toggleSidebar={toggleSidebar} setToggleSidebar={setToggleSidebar} />
          {settingsLayout && (memberType?.isGuest || memberType?.isViewer) ? (
            <NotAuthorizedView
              actionButton={
                <Link href={`/${workspaceSlug}`}>
                  <a>
                    <Button className="flex items-center gap-1">
                      <LayerDiagonalIcon height={16} width={16} color="white" /> Go to workspace
                    </Button>
                  </a>
                </Link>
              }
              type="workspace"
            />
          ) : (
            <main
              className={`relative flex h-full w-full flex-col overflow-hidden ${
                bg === "primary"
                  ? "bg-custom-background-100"
                  : bg === "secondary"
                  ? "bg-custom-background-90"
                  : "bg-custom-background-80"
              }`}
            >
              <AppHeader
                breadcrumbs={breadcrumbs}
                left={left}
                right={right}
                setToggleSidebar={setToggleSidebar}
                noHeader={noHeader}
              />
              <div className="h-full w-full overflow-hidden">
                <div className="relative h-full w-full overflow-x-hidden overflow-y-scroll">{children}</div>
              </div>
            </main>
          )}
        </div>
      </WorkspaceMemberProvider>
    </UserAuthorizationLayout>
  );
};
