import React, { useEffect, useState } from "react";
// next
import type { NextPage } from "next";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// services
import workspaceService from "lib/services/workspace.service";
import userService from "lib/services/user.service";
// hooks
import useUser from "lib/hooks/useUser";
// constants
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
import type { IWorkspaceInvitation } from "types";
import Link from "next/link";

const OnBoard: NextPage = () => {
  const router = useRouter();

  const { workspaces, mutateWorkspaces, user } = useUser();

  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);

  const { data: invitations, mutate } = useSWR<IWorkspaceInvitation[]>(
    USER_WORKSPACE_INVITATIONS,
    () => workspaceService.userWorkspaceInvitations()
  );

  const handleInvitation = (
    workspace_invitation: IWorkspaceInvitation,
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
        router.push("/workspace");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // useEffect(() => {
  //   if (workspaces && workspaces.length === 0) setCanRedirect(false);
  // }, [workspaces]);

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
          <div className="w-96 p-2 rounded-lg bg-indigo-100 text-indigo-600 mb-10">
            <p className="text-sm text-center">logged in as {user.email}</p>
          </div>
        )}

        <div className="w-full md:w-2/3 lg:w-1/3 p-8 rounded-lg">
          {invitations && workspaces ? (
            invitations.length > 0 ? (
              <div className="mt-3 sm:mt-5">
                <div className="mt-2">
                  <h2 className="text-2xl font-medium mb-4">Join your workspaces</h2>
                  <div className="space-y-2 mb-12">
                    {invitations.map((item) => (
                      <div
                        className="relative flex items-center border px-4 py-2 rounded"
                        key={item.id}
                      >
                        <div className="ml-3 text-sm flex flex-col items-start w-full">
                          <h3 className="font-medium text-xl text-gray-700">
                            {item.workspace.name}
                          </h3>
                          <p className="text-sm">invited by {item.workspace.owner.first_name}</p>
                        </div>
                        <div className="flex gap-x-2 h-5 items-center">
                          <div className="h-full flex items-center gap-x-1">
                            <input
                              id={`${item.id}`}
                              aria-describedby="workspaces"
                              name={`${item.id}`}
                              checked={invitationsRespond.includes(item.id)}
                              value={item.workspace.name}
                              onChange={() => {
                                handleInvitation(
                                  item,
                                  invitationsRespond.includes(item.id) ? "withdraw" : "accepted"
                                );
                              }}
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor={item.id} className="text-sm">
                              Accept
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                <div className="mt-6">
                  <Button className="w-full" onClick={submitInvitations}>
                    Accept and Continue
                  </Button>
                </div>
              </div>
            ) : workspaces && workspaces.length > 0 ? (
              <div className="mt-3 flex flex-col gap-y-3">
                <h2 className="text-2xl font-medium mb-4">Your workspaces</h2>
                {workspaces.map((workspace) => (
                  <div
                    className="flex items-center justify-between border px-4 py-2 rounded mb-2"
                    key={workspace.id}
                  >
                    <div className="flex items-center gap-x-2">
                      <CubeIcon className="h-5 w-5 text-gray-400" />
                      <Link href={"/workspace"}>{workspace.name}</Link>
                    </div>
                    <div className="flex items-center gap-x-2">
                      <p className="text-sm">{workspace.owner.first_name}</p>
                    </div>
                  </div>
                ))}
                <Link href={"/workspace"}>
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
            <div className="w-full h-full flex justify-center items-center">
              <Spinner />
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default OnBoard;
