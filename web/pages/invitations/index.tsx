import React, { useState, ReactElement } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { useTheme } from "next-themes";
import { observer } from "mobx-react-lite";
import { CheckCircle2 } from "lucide-react";
// services
import { WorkspaceService } from "services/workspace.service";
import { UserService } from "services/user.service";
// hooks
import { useApplication, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// layouts
import DefaultLayout from "layouts/default-layout";
import { UserAuthWrapper } from "layouts/auth-layout";
// ui
import { Button } from "@plane/ui";
// images
import BlackHorizontalLogo from "public/plane-logos/black-horizontal-with-blue-logo.svg";
import WhiteHorizontalLogo from "public/plane-logos/white-horizontal-with-blue-logo.svg";
import emptyInvitation from "public/empty-state/invitation.svg";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import { NextPageWithLayout } from "lib/types";
import type { IWorkspaceMemberInvitation } from "@plane/types";
// constants
import { ROLE } from "constants/workspace";
// components
import { EmptyState } from "components/common";

// services
const workspaceService = new WorkspaceService();
const userService = new UserService();

const UserInvitationsPage: NextPageWithLayout = observer(() => {
  // states
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);
  const [isJoiningWorkspaces, setIsJoiningWorkspaces] = useState(false);
  // store hooks
  const {
    eventTracker: { postHogEventTracker },
  } = useApplication();
  const { currentUser, currentUserSettings } = useUser();
  // router
  const router = useRouter();
  // next-themes
  const { theme } = useTheme();
  // toast alert
  const { setToastAlert } = useToast();

  const { data: invitations } = useSWR("USER_WORKSPACE_INVITATIONS", () => workspaceService.userWorkspaceInvitations());

  const redirectWorkspaceSlug =
    currentUserSettings?.workspace?.last_workspace_slug ||
    currentUserSettings?.workspace?.fallback_workspace_slug ||
    "";

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
      .then((res) => {
        mutate("USER_WORKSPACES");
        const firstInviteId = invitationsRespond[0];
        const redirectWorkspace = invitations?.find((i) => i.id === firstInviteId)?.workspace;
        postHogEventTracker("MEMBER_ACCEPTED", {
          ...res,
          state: "SUCCESS",
          accepted_from: "App",
        });
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
    <div className="flex h-full flex-col gap-y-2 overflow-hidden sm:flex-row sm:gap-y-0">
      <div className="relative h-1/6 flex-shrink-0 sm:w-2/12 md:w-3/12 lg:w-1/5">
        <div className="absolute left-0 top-1/2 h-[0.5px] w-full -translate-y-1/2 border-b-[0.5px] border-custom-border-200 sm:left-1/2 sm:top-0 sm:h-screen sm:w-[0.5px] sm:-translate-x-1/2 sm:translate-y-0 sm:border-r-[0.5px] md:left-1/3" />
        <div className="absolute left-5 top-1/2 grid -translate-y-1/2 place-items-center bg-custom-background-100 px-3 sm:left-1/2 sm:top-12 sm:-translate-x-[15px] sm:translate-y-0 sm:px-0 sm:py-5 md:left-1/3">
          <div className="h-[30px] w-[133px]">
            {theme === "light" ? (
              <Image src={BlackHorizontalLogo} alt="Plane black logo" />
            ) : (
              <Image src={WhiteHorizontalLogo} alt="Plane white logo" />
            )}
          </div>
        </div>
        <div className="absolute right-4 top-1/4 -translate-y-1/2 text-sm text-custom-text-100 sm:fixed sm:right-16 sm:top-12 sm:translate-y-0 sm:py-5">
          {currentUser?.email}
        </div>
      </div>
      {invitations ? (
        invitations.length > 0 ? (
          <div className="relative flex h-full justify-center px-8 pb-8 sm:w-10/12 sm:items-center sm:justify-start sm:p-0 sm:pr-[8.33%] md:w-9/12 lg:w-4/5">
            <div className="w-full space-y-10">
              <h5 className="text-lg">We see that someone has invited you to</h5>
              <h4 className="text-2xl font-semibold">Join a workspace</h4>
              <div className="max-h-[37vh] space-y-4 overflow-y-auto md:w-3/5">
                {invitations.map((invitation) => {
                  const isSelected = invitationsRespond.includes(invitation.id);

                  return (
                    <div
                      key={invitation.id}
                      className={`flex cursor-pointer items-center gap-2 rounded border px-3.5 py-5 ${
                        isSelected
                          ? "border-custom-primary-100"
                          : "border-custom-border-200 hover:bg-custom-background-80"
                      }`}
                      onClick={() => handleInvitation(invitation, isSelected ? "withdraw" : "accepted")}
                    >
                      <div className="flex-shrink-0">
                        <div className="grid h-9 w-9 place-items-center rounded">
                          {invitation.workspace.logo && invitation.workspace.logo.trim() !== "" ? (
                            <img
                              src={invitation.workspace.logo}
                              height="100%"
                              width="100%"
                              className="rounded"
                              alt={invitation.workspace.name}
                            />
                          ) : (
                            <span className="grid h-9 w-9 place-items-center rounded bg-gray-700 px-3 py-1.5 uppercase text-white">
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
                        className={`flex-shrink-0 ${isSelected ? "text-custom-primary-100" : "text-custom-text-200"}`}
                      >
                        <CheckCircle2 className="h-5 w-5" />
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
                <Link href={`/${redirectWorkspaceSlug}`}>
                  <span>
                    <Button variant="neutral-primary" size="md">
                      Go Home
                    </Button>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="fixed left-0 top-0 grid h-full w-full place-items-center">
            <EmptyState
              title="No pending invites"
              description="You can see here if someone invites you to a workspace."
              image={emptyInvitation}
              primaryButton={{
                text: "Back to dashboard",
                onClick: () => router.push("/"),
              }}
            />
          </div>
        )
      ) : null}
    </div>
  );
});

UserInvitationsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <UserAuthWrapper>
      <DefaultLayout>{page}</DefaultLayout>
    </UserAuthWrapper>
  );
};

export default UserInvitationsPage;
