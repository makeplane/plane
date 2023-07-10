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
import { OnboardingLogo } from "components/onboarding";
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
        <div className="relative grid h-full place-items-center p-5">
          <div className="h-full flex flex-col items-center justify-center w-full py-4">
            <div className="mb-7 flex items-center justify-center text-center">
              <OnboardingLogo className="h-12 w-48 fill-current text-custom-text-100" />
            </div>

            <div className="flex h-[436px] w-full max-w-xl rounded-[10px] p-7 bg-custom-background-100 shadow-md">
              {invitations && workspaces ? (
                invitations.length > 0 ? (
                  <div className="flex w-full flex-col gap-3 justify-between">
                    <div className="flex flex-col gap-2 justify-center ">
                      <h3 className="text-base font-semibold text-custom-text-100">
                        Workspace Invitations
                      </h3>
                      <p className="text-sm text-custom-text-200">
                        Create or join the workspace to get started with Plane.
                      </p>
                    </div>

                    <ul role="list" className="h-[255px] w-full overflow-y-auto">
                      {invitations.map((invitation) => (
                        <SingleInvitation
                          key={invitation.id}
                          invitation={invitation}
                          invitationsRespond={invitationsRespond}
                          handleInvitation={handleInvitation}
                        />
                      ))}
                    </ul>

                    <div className="flex items-center gap-3">
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
                  <div className="flex flex-col w-full overflow-auto gap-y-3">
                    <h2 className="mb-4 text-xl font-medium">Your workspaces</h2>
                    {workspaces.map((workspace) => (
                      <Link key={workspace.id} href={workspace.slug}>
                        <a>
                          <div className="mb-2 flex items-center justify-between rounded border border-custom-border-100 px-4 py-2">
                            <div className="flex items-center gap-x-2 text-sm">
                              <CubeIcon className="h-5 w-5 text-custom-text-200" />
                              {workspace.name}
                            </div>
                            <div className="flex items-center gap-x-2 text-xs text-custom-text-200">
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
          <div className="absolute flex flex-col gap-1 justify-center items-start left-5 top-5">
            <span className="text-xs text-custom-text-200">Logged in:</span>
            <span className="text-sm text-custom-text-100">{user?.email}</span>
          </div>
        </div>
      </DefaultLayout>
    </UserAuthorizationLayout>
  );
};

export default OnBoard;
