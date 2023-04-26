import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// contexts
import { useProjectMyMembership, ProjectMemberProvider } from "contexts/project-member.context";
// hooks
import useIssuesView from "hooks/use-issues-view";
// layouts
import Container from "layouts/container";
import AppHeader from "layouts/app-layout/app-header";
import AppSidebar from "layouts/app-layout/app-sidebar";
import SettingsNavbar from "layouts/settings-navbar";
// components
import { NotAuthorizedView, JoinProject } from "components/auth-screens";
import { CommandPalette } from "components/command-palette";
// ui
import { PrimaryButton, Spinner } from "components/ui";
// icons
import { LayerDiagonalIcon } from "components/icons";

type Meta = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  url?: string | null;
};

type Props = {
  meta?: Meta;
  children: React.ReactNode;
  noPadding?: boolean;
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
  meta,
  children,
  noPadding = false,
  noHeader = false,
  bg = "primary",
  breadcrumbs,
  left,
  right,
}) => {
  const [toggleSidebar, setToggleSidebar] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issueView } = useIssuesView();

  const { loading, error, memberRole: memberType } = useProjectMyMembership();

  const settingsLayout = router.pathname.includes("/settings");

  return (
    <Container meta={meta}>
      <CommandPalette />
      <div className="flex h-screen w-full overflow-hidden">
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
            className={`relative w-full overflow-hidden border-l border-red-500 ${
              bg === "primary"
                ? "bg-brand-surface-1"
                : bg === "secondary"
                ? "bg-brand-sidebar"
                : "bg-brand-base"
            }`}
          >
            {!noHeader && (
              <AppHeader
                breadcrumbs={breadcrumbs}
                left={left}
                right={right}
                setToggleSidebar={setToggleSidebar}
              />
            )}
            <div
              className={
                issueView === "kanban"
                  ? "h-full w-full border border-white"
                  : `flex w-full flex-grow flex-col ${
                      noPadding || issueView === "list"
                        ? ""
                        : settingsLayout
                        ? "p-8 lg:px-28"
                        : "p-8"
                    }`
              }
            >
              {settingsLayout && (
                <div className="mb-12 space-y-6">
                  <div>
                    <h3 className="text-3xl font-semibold">Project Settings</h3>
                    <p className="mt-1 text-brand-secondary">
                      This information will be displayed to every member of the project.
                    </p>
                  </div>
                  <SettingsNavbar />
                </div>
              )}
              {/* {children} */}
            </div>
          </main>
        )}
      </div>
    </Container>
  );
};
