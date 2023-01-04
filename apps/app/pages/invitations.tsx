import React, { useState } from "react";
// next
import Link from "next/link";
import { useRouter } from "next/router";
import type { NextPage, NextPageContext } from "next";
// swr
import useSWR from "swr";
// services
import workspaceService from "lib/services/workspace.service";
import userService from "lib/services/user.service";
// hooks
import useUser from "lib/hooks/useUser";
// constants
import { requiredAuth } from "lib/auth";
import { USER_WORKSPACE_INVITATIONS } from "constants/api-routes";
// layouts
import DefaultLayout from "layouts/DefaultLayout";
// components
import SingleInvitation from "components/workspace/SingleInvitation";
// ui
import { Button, Spinner, EmptySpace, EmptySpaceItem } from "ui";
// icons
import { CubeIcon, PlusIcon } from "@heroicons/react/24/outline";
// types
import type { IWorkspaceMemberInvitation } from "types";

const OnBoard: NextPage = () => {
  const router = useRouter();

  const { workspaces, mutateWorkspaces, user, slug } = useUser();

  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);

  const { data: invitations, mutate } = useSWR(USER_WORKSPACE_INVITATIONS, () =>
    workspaceService.userWorkspaceInvitations()
  );

  const handleInvitation = (
    workspace_invitation: IWorkspaceMemberInvitation,
    action: "accepted" | "withdraw"
  ) => {
    if (action === "accepted") {
      setInvitationsRespond((prevData) => {
        return [...prevData, workspace_invitation.id];
      });
    } else if (action === "withdraw") {
      setInvitationsRespond((prevData) => {
        return prevData.filter((item: string) => item !== workspace_invitation.id);
      });
    }
  };

  const submitInvitations = () => {
    userService.updateUserOnBoard().then((response) => {
      console.log(response);
    });
    workspaceService
      .joinWorkspaces({ invitations: invitationsRespond })
      .then(async (res: any) => {
        console.log(res);
        await mutate();
        await mutateWorkspaces();
        router.push(slug || "");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <DefaultLayout
      meta={{
        title: "Plane - Welcome to Plane",
        description:
          "Please fasten your seatbelts because we are about to take your productivity to the next level.",
      }}
    >
      <div className="flex min-h-full flex-col items-center justify-center p-4 sm:p-0">
        {user && (
          <div className="mb-10 w-96 rounded-lg bg-indigo-100 p-2 text-theme">
            <p className="text-center text-sm">logged in as {user.email}</p>
          </div>
        )}

        <div className="w-full rounded-lg p-8 md:w-2/3 lg:w-1/3">
          {invitations && workspaces ? (
            invitations.length > 0 ? (
              <div>
                <h2 className="text-lg font-medium text-gray-900">Workspace Invitations</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Select invites that you want to accept.
                </p>
                <ul
                  role="list"
                  className="mt-6 divide-y divide-gray-200 border-t border-b border-gray-200"
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
                  <Button
                    className="w-full"
                    theme="secondary"
                    onClick={() => router.push(`/${slug}` || "/create-workspace")}
                  >
                    Skip
                  </Button>
                  <Button className="w-full" onClick={submitInvitations}>
                    Accept and Continue
                  </Button>
                </div>
              </div>
            ) : workspaces && workspaces.length > 0 ? (
              <div className="mt-3 flex flex-col gap-y-3">
                <h2 className="mb-4 text-2xl font-medium">Your workspaces</h2>
                {workspaces.map((workspace) => (
                  <div
                    className="mb-2 flex items-center justify-between rounded border px-4 py-2"
                    key={workspace.id}
                  >
                    <div className="flex items-center gap-x-2">
                      <CubeIcon className="h-5 w-5 text-gray-400" />
                      <Link href={workspace.slug}>
                        <a>{workspace.name}</a>
                      </Link>
                    </div>
                    <div className="flex items-center gap-x-2">
                      <p className="text-sm">{workspace.owner.first_name}</p>
                    </div>
                  </div>
                ))}
                <Link href={`/${slug || ""}`}>
                  <Button type="button">Go to workspaces</Button>
                </Link>
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
  );
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.req?.url;

  if (!user) {
    return {
      redirect: {
        destination: `/signin?next=${redirectAfterSignIn}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
};

export default OnBoard;
