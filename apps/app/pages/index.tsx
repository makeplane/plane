import { useEffect } from "react";
import { useRouter } from "next/router";
// services
import userService from "services/user.service";
import workspaceService from "services/workspace.service";
// ui
import { Spinner } from "components/ui";
// types
import type { NextPage } from "next";
import useUser from "hooks/use-user";
import { IWorkspace } from "types";
// layouts
import DefaultLayout from "layouts/default-layout";

const Home: NextPage = () => {
  const router = useRouter();
  const { user, isUserLoading, userError } = useUser();
  console.log("isUserLoading", isUserLoading);

  useEffect(() => {
    console.log("user", user);
    if (!user && !isUserLoading) {
      router.push("/signin");
      return;
    } else if (!isUserLoading && !user?.user?.is_onboarded) {
      router.push("/onboarding");
      return;
    } else if (user && !isUserLoading) {
      workspaceService.userWorkspaces().then(async (userWorkspaces) => {
        const lastActiveWorkspace = userWorkspaces.find(
          (workspace: IWorkspace) => workspace.id === user?.user?.last_workspace_id
        );
        if (lastActiveWorkspace) {
          router.push(`/${lastActiveWorkspace.slug}`);
          return;
        } else if (userWorkspaces.length > 0) {
          router.push(`/${userWorkspaces[0].slug}`);
          return;
        } else {
          const invitations = await workspaceService.userWorkspaceInvitations();
          if (invitations.length > 0) {
            router.push(`/invitations`);
            return;
          } else {
            router.push(`/create-workspace`);
            return;
          }
        }
      });
    }
  }, [user, isUserLoading]);

  return (
    <DefaultLayout
      meta={{
        title: "Plane - Sign In",
      }}
    >
      <div className="grid h-screen place-items-center">
        <Spinner />
      </div>
    </DefaultLayout>
  );
};

export default Home;
