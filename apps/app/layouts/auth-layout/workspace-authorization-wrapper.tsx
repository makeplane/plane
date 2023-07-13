import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceServices from "services/workspace.service";
// contexts
import { WorkspaceMemberProvider } from "contexts/workspace-member.context";
// layouts
import AppSidebar from "layouts/app-layout/app-sidebar";
import AppHeader from "layouts/app-layout/app-header";
import { UserAuthorizationLayout } from "./user-authorization-wrapper";
// components
import { NotAuthorizedView, NotAWorkspaceMember } from "components/auth-screens";
import { CommandPalette } from "components/command-palette";
// icons
import { PrimaryButton, Spinner } from "components/ui";
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
    workspaceSlug ? () => workspaceServices.workspaceMemberMe(workspaceSlug.toString()) : null
  );

  if (!workspaceMemberMe && !error)
    return (
      <div className="grid h-screen place-items-center p-4">
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
      <div className="container flex h-screen items-center justify-center">
        <p className="text-2xl font-semibold">No such workspace exist. Create one?</p>
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
                    <PrimaryButton className="flex items-center gap-1">
                      <LayerDiagonalIcon height={16} width={16} color="white" /> Go to workspace
                    </PrimaryButton>
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
                <div className="relative h-full w-full overflow-x-hidden overflow-y-scroll">
                  {children}
                </div>
              </div>
            </main>
          )}
        </div>
      </WorkspaceMemberProvider>
    </UserAuthorizationLayout>
  );
};
