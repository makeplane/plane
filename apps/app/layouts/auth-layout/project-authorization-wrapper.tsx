import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// contexts
import { useProjectMyMembership, ProjectMemberProvider } from "contexts/project-member.context";
// layouts
import AppHeader from "layouts/app-layout/app-header";
import AppSidebar from "layouts/app-layout/app-sidebar";
// components
import { NotAuthorizedView, JoinProject } from "components/auth-screens";
import { CommandPalette } from "components/command-palette";
// ui
import { PrimaryButton, Spinner } from "components/ui";
// icons
import { LayerDiagonalIcon } from "components/icons";

type Props = {
  children: React.ReactNode;
  noHeader?: boolean;
  bg?: "primary" | "secondary";
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
};

export const ProjectAuthorizationWrapper: React.FC<Props> = (props) => (
  <ProjectMemberProvider>
    <ProjectAuthorizationWrapped {...props} />
  </ProjectMemberProvider>
);

const ProjectAuthorizationWrapped: React.FC<Props> = ({
  children,
  noHeader = false,
  bg = "primary",
  breadcrumbs,
  left,
  right,
}) => {
  const [toggleSidebar, setToggleSidebar] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { loading, error, memberRole: memberType } = useProjectMyMembership();

  const settingsLayout = router.pathname.includes("/settings");

  return (
    <>
      <CommandPalette />
      <div className="relative flex h-screen w-full overflow-hidden">
        <AppSidebar toggleSidebar={toggleSidebar} setToggleSidebar={setToggleSidebar} />

        {loading ? (
          <div className="grid h-full w-full place-items-center p-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <h3 className="text-xl">Loading your project...</h3>
              <Spinner />
            </div>
          </div>
        ) : error?.status === 401 || error?.status === 403 ? (
          <JoinProject />
        ) : error?.status === 404 ? (
          <div className="container grid h-screen place-items-center">
            <div className="space-y-4 text-center">
              <p className="text-2xl font-semibold">No such project exists. Create one?</p>
              <PrimaryButton
                onClick={() => {
                  const e = new KeyboardEvent("keydown", { key: "p" });
                  document.dispatchEvent(e);
                }}
              >
                Create project
              </PrimaryButton>
            </div>
          </div>
        ) : settingsLayout && (memberType?.isGuest || memberType?.isViewer) ? (
          <NotAuthorizedView
            actionButton={
              <Link href={`/${workspaceSlug}/projects/${projectId}/issues`}>
                <a>
                  <PrimaryButton className="flex items-center gap-1">
                    <LayerDiagonalIcon height={16} width={16} color="white" /> Go to issues
                  </PrimaryButton>
                </a>
              </Link>
            }
            type="project"
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
              <div className="h-full w-full overflow-x-hidden overflow-y-scroll">{children}</div>
            </div>
          </main>
        )}
      </div>
    </>
  );
};
