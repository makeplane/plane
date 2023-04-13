import { useEffect } from "react";

import Router from "next/router";

// services
import userService from "services/user.service";
import workspaceService from "services/workspace.service";
// ui
import { Spinner } from "components/ui";
// types
import type { NextPage } from "next";

const redirectUserTo = async () => {
  const user = await userService
    .currentUser()
    .then((res) => res)
    .catch(() => {
      Router.push("/signin");
      return;
    });

  if (!user) {
    Router.push("/signin");
    return;
  } else if (!user.user.is_onboarded) {
    Router.push("/onboarding");
    return;
  } else {
    const userWorkspaces = await workspaceService.userWorkspaces();

    const lastActiveWorkspace = userWorkspaces.find(
      (workspace) => workspace.id === user.user.last_workspace_id
    );

    if (lastActiveWorkspace) {
      Router.push(`/${lastActiveWorkspace.slug}`);
      return;
    } else if (userWorkspaces.length > 0) {
      Router.push(`/${userWorkspaces[0].slug}`);
      return;
    } else {
      const invitations = await workspaceService.userWorkspaceInvitations();
      if (invitations.length > 0) {
        Router.push(`/invitations`);
        return;
      } else {
        Router.push(`/create-workspace`);
        return;
      }
    }
  }
};

const Home: NextPage = () => {
  useEffect(() => {
    redirectUserTo();
  }, []);

  return (
    <div className="grid h-screen place-items-center">
      <Spinner />
    </div>
  );
};

export default Home;
