import { useEffect } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
// hooks
import useUser from "hooks/use-user";
import useWorkspaces from "hooks/use-workspaces";
// ui
import { Spinner } from "components/ui";
// types
import type { NextPage } from "next";
// fetch-keys
import { USER_WORKSPACE_INVITATIONS } from "constants/fetch-keys";

const Home: NextPage = () => {
  const router = useRouter();

  const { user } = useUser();
  const { workspaces } = useWorkspaces();

  const lastActiveWorkspace =
    user && workspaces.find((workspace) => workspace.id === user.last_workspace_id);

  const { data: invitations } = useSWR(USER_WORKSPACE_INVITATIONS, () =>
    workspaceService.userWorkspaceInvitations()
  );

  useEffect(() => {
    if (!user) {
      router.push("/signin");
      return;
    }

    if (!user.is_onboarded) {
      router.push("/onboarding");
      return;
    }

    if (lastActiveWorkspace) {
      router.push(`/${lastActiveWorkspace.slug}`);
      return;
    } else if (workspaces.length > 0) {
      router.push(`/${workspaces[0].slug}`);
      return;
    }

    if (invitations && invitations.length > 0) {
      router.push("/invitations");
      return;
    } else {
      router.push("/create-workspace");
      return;
    }
  }, [user, router, lastActiveWorkspace, workspaces, invitations]);

  return (
    <div className="h-screen grid place-items-center">
      <Spinner />
    </div>
  );
};

export default Home;
