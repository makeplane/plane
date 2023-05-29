import React, { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
// hooks
import useUser from "hooks/use-user";
import useToast from "hooks/use-toast";
// layouts
import DefaultLayout from "layouts/default-layout";
import { UserAuthorizationLayout } from "layouts/auth-layout/user-authorization-wrapper";
// components
import SingleInvitation from "components/workspace/single-invitation";
// ui
import { Spinner, EmptySpace, EmptySpaceItem, SecondaryButton, PrimaryButton } from "components/ui";
// icons
import { CubeIcon, PlusIcon } from "@heroicons/react/24/outline";
// types
import type { NextPage } from "next";
import type { IWorkspaceMemberInvitation } from "types";
// fetch-keys
import { USER_WORKSPACE_INVITATIONS } from "constants/fetch-keys";

const OnBoard: NextPage = () => {
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);

  const { user } = useUser();

  const router = useRouter();

  const { setToastAlert } = useToast();

  const { data: invitations, mutate: mutateInvitations } = useSWR(USER_WORKSPACE_INVITATIONS, () =>
    workspaceService.userWorkspaceInvitations()
  );

  const { data: workspaces, mutate: mutateWorkspaces } = useSWR("USER_WORKSPACES", () =>
    workspaceService.userWorkspaces()
  );

  const handleInvitation = (
    workspace_invitation: IWorkspaceMemberInvitation,
    action: "accepted" | "withdraw"
  ) => {
    if (action === "accepted") {
      setInvitationsRespond((prevData) => [...prevData, workspace_invitation.id]);
    } else if (action === "withdraw") {
      setInvitationsRespond((prevData) =>
        prevData.filter((item: string) => item !== workspace_invitation.id)
      );
    }
  };

  const submitInvitations = () => {
    // userService.updateUserOnBoard();

    if (invitationsRespond.length === 0) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Please select atleast one invitation.",
      });
      return;
    }

    workspaceService
      .joinWorkspaces({ invitations: invitationsRespond })
      .then(() => {
        mutateInvitations();
        mutateWorkspaces();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <UserAuthorizationLayout>
      <DefaultLayout>
        <div className="flex min-h-full flex-col items-center justify-center p-4 sm:p-0">
          {user && (
            <div className="mb-10 w-96 rounded-lg bg-brand-accent/20 p-2 text-brand-accent">
              <p className="text-center text-sm">logged in as {user.email}</p>
            </div>
          )}

          <div className="w-full rounded-lg p-8 md:w-2/3 lg:w-1/3">
            {invitations && workspaces ? (
              invitations.length > 0 ? (
                <div>
                  <h2 className="text-lg font-medium">Workspace Invitations</h2>
                  <p className="mt-1 text-sm text-brand-secondary">
                    Select invites that you want to accept.
                  </p>
                  <ul
                    role="list"
                    className="mt-6 divide-y divide-brand-base border-t border-b border-brand-base"
                  >
                    {invitations.map((invitation) => (
                      <SingleInvitation
                        key={invitation.id}
                        invitation={invitation}
                        invitationsRespond={invitationsRespond}
                        handleInvitation={handleInvitation}
                      />
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center gap-2">
                    <Link href="/">
                      <a className="w-full">
                        <SecondaryButton className="w-full">Go Home</SecondaryButton>
                      </a>
                    </Link>
                    <PrimaryButton className="w-full" onClick={submitInvitations}>
                      Accept and Continue
                    </PrimaryButton>
                  </div>
                </div>
              ) : workspaces && workspaces.length > 0 ? (
                <div className="flex flex-col gap-y-3">
                  <h2 className="mb-4 text-xl font-medium">Your workspaces</h2>
                  {workspaces.map((workspace) => (
                    <Link key={workspace.id} href={workspace.slug}>
                      <a>
                        <div className="mb-2 flex items-center justify-between rounded border border-brand-base px-4 py-2">
                          <div className="flex items-center gap-x-2 text-sm">
                            <CubeIcon className="h-5 w-5 text-brand-secondary" />
                            {workspace.name}
                          </div>
                          <div className="flex items-center gap-x-2 text-xs text-brand-secondary">
                            {workspace.owner.first_name}
                          </div>
                        </div>
                      </a>
                    </Link>
                  ))}
                </div>
              ) : (
                invitations.length === 0 &&
                workspaces.length === 0 && (
                  <EmptySpace
                    title="You don't have any workspaces yet"
                    description="Your workspace is where you'll create projects, collaborate on your issues, and organize different streams of work in your Plane account."
                  >
                    <EmptySpaceItem
                      Icon={PlusIcon}
                      title={"Create your Workspace"}
                      action={() => {
                        router.push("/create-workspace");
                      }}
                    />
                  </EmptySpace>
                )
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Spinner />
              </div>
            )}
          </div>
        </div>
      </DefaultLayout>
    </UserAuthorizationLayout>
  );
};

export default OnBoard;
