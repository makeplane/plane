import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { useTheme } from "next-themes";
// services
import { WorkspaceService } from "services/workspace.service";
import { UserService } from "services/user.service";
// hooks
import useUser from "hooks/use-user";
import useToast from "hooks/use-toast";
// layouts
import DefaultLayout from "layouts/default-layout";
import { UserAuthorizationLayout } from "layouts/auth-layout-legacy/user-authorization-wrapper";
// ui
import { Button } from "@plane/ui";
// icons
import { CheckCircleIcon } from "@heroicons/react/24/outline";
// images
import BlackHorizontalLogo from "public/plane-logos/black-horizontal-with-blue-logo.svg";
import WhiteHorizontalLogo from "public/plane-logos/white-horizontal-with-blue-logo.svg";
import emptyInvitation from "public/empty-state/invitation.svg";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import type { NextPage } from "next";
import type { IWorkspaceMemberInvitation } from "types";
// constants
import { ROLE } from "constants/workspace";
// components
import { EmptyState } from "components/common";

// services
const workspaceService = new WorkspaceService();
const userService = new UserService();

const UserInvitationsPage: NextPage = () => {
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);
  const [isJoiningWorkspaces, setIsJoiningWorkspaces] = useState(false);

  const router = useRouter();

  const { theme } = useTheme();

  const { user } = useUser();

  const { setToastAlert } = useToast();

  const { data: invitations } = useSWR<IWorkspaceMemberInvitation[]>("USER_WORKSPACE_INVITATIONS", () =>
    workspaceService.userWorkspaceInvitations()
  );

  const handleInvitation = (workspace_invitation: IWorkspaceMemberInvitation, action: "accepted" | "withdraw") => {
    if (action === "accepted") {
      setInvitationsRespond((prevData) => [...prevData, workspace_invitation.id]);
    } else if (action === "withdraw") {
      setInvitationsRespond((prevData) => prevData.filter((item: string) => item !== workspace_invitation.id));
    }
  };

  const submitInvitations = () => {
    if (invitationsRespond.length === 0) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Please select at least one invitation.",
      });
      return;
    }

    setIsJoiningWorkspaces(true);

    workspaceService
      .joinWorkspaces({ invitations: invitationsRespond })
      .then(() => {
        mutate("USER_WORKSPACES");
        const firstInviteId = invitationsRespond[0];
        const redirectWorkspace = invitations?.find((i) => i.id === firstInviteId)?.workspace;
        userService
          .updateUser({ last_workspace_id: redirectWorkspace?.id })
          .then(() => {
            setIsJoiningWorkspaces(false);
            router.push(`/${redirectWorkspace?.slug}`);
          })
          .catch(() => {
            setToastAlert({
              type: "error",
              title: "Error!",
              message: "Something went wrong, Please try again.",
            });
            setIsJoiningWorkspaces(false);
          });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong, Please try again.",
        });
        setIsJoiningWorkspaces(false);
      });
  };

  return (
    <UserAuthorizationLayout>
      <DefaultLayout>
        <div className="flex h-full flex-col gap-y-2 sm:gap-y-0 sm:flex-row overflow-hidden">
          <div className="relative h-1/6 flex-shrink-0 sm:w-2/12 md:w-3/12 lg:w-1/5">
            <div className="absolute border-b-[0.5px] sm:border-r-[0.5px] border-custom-border-200 h-[0.5px] w-full top-1/2 left-0 -translate-y-1/2 sm:h-screen sm:w-[0.5px] sm:top-0 sm:left-1/2 md:left-1/3 sm:-translate-x-1/2 sm:translate-y-0" />
            <div className="absolute grid place-items-center bg-custom-background-100 px-3 sm:px-0 sm:py-5 left-5 sm:left-1/2 md:left-1/3 sm:-translate-x-[15px] top-1/2 -translate-y-1/2 sm:translate-y-0 sm:top-12">
              <div className="h-[30px] w-[133px]">
                {theme === "light" ? (
                  <Image src={BlackHorizontalLogo} alt="Plane black logo" />
                ) : (
                  <Image src={WhiteHorizontalLogo} alt="Plane white logo" />
                )}
              </div>
            </div>
            <div className="absolute sm:fixed text-custom-text-100 text-sm right-4 top-1/4 sm:top-12 -translate-y-1/2 sm:translate-y-0 sm:right-16 sm:py-5">
              {user?.email}
            </div>
          </div>
          {invitations ? (
            invitations.length > 0 ? (
              <div className="relative flex justify-center sm:justify-start sm:items-center h-full px-8 pb-8 sm:p-0 sm:pr-[8.33%] sm:w-10/12 md:w-9/12 lg:w-4/5">
                <div className="w-full space-y-10">
                  <h5 className="text-lg">We see that someone has invited you to</h5>
                  <h4 className="text-2xl font-semibold">Join a workspace</h4>
                  <div className="max-h-[37vh] md:w-3/5 space-y-4 overflow-y-auto">
                    {invitations.map((invitation) => {
                      const isSelected = invitationsRespond.includes(invitation.id);

                      return (
                        <div
                          key={invitation.id}
                          className={`flex cursor-pointer items-center gap-2 border py-5 px-3.5 rounded ${
                            isSelected
                              ? "border-custom-primary-100"
                              : "border-custom-border-200 hover:bg-custom-background-80"
                          }`}
                          onClick={() => handleInvitation(invitation, isSelected ? "withdraw" : "accepted")}
                        >
                          <div className="flex-shrink-0">
                            <div className="grid place-items-center h-9 w-9 rounded">
                              {invitation.workspace.logo && invitation.workspace.logo !== "" ? (
                                <img
                                  src={invitation.workspace.logo}
                                  height="100%"
                                  width="100%"
                                  className="rounded"
                                  alt={invitation.workspace.name}
                                />
                              ) : (
                                <span className="grid place-items-center h-9 w-9 py-1.5 px-3 rounded bg-gray-700 uppercase text-white">
                                  {invitation.workspace.name[0]}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium">{truncateText(invitation.workspace.name, 30)}</div>
                            <p className="text-xs text-custom-text-200">{ROLE[invitation.role]}</p>
                          </div>
                          <span
                            className={`flex-shrink-0 ${
                              isSelected ? "text-custom-primary-100" : "text-custom-text-200"
                            }`}
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      type="submit"
                      size="md"
                      onClick={submitInvitations}
                      disabled={isJoiningWorkspaces || invitationsRespond.length === 0}
                      loading={isJoiningWorkspaces}
                    >
                      Accept & Join
                    </Button>
                    <Link href="/">
                      <a>
                        <Button variant="neutral-primary" size="md">
                          Go Home
                        </Button>
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="fixed top-0 left-0 h-full w-full grid place-items-center">
                <EmptyState
                  title="No pending invites"
                  description="You can see here if someone invites you to a workspace."
                  image={emptyInvitation}
                  primaryButton={{
                    text: "Back to Dashboard",
                    onClick: () => router.push("/"),
                  }}
                />
              </div>
            )
          ) : null}
        </div>
      </DefaultLayout>
    </UserAuthorizationLayout>
  );
};

export default UserInvitationsPage;
