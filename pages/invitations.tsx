import React, { useEffect, useState } from "react";
// next
import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import workspaceService from "lib/services/workspace.service";
import userService from "lib/services/user.service";
// hooks
import useUser from "lib/hooks/useUser";
// constants
import { USER_WORKSPACE_INVITATIONS } from "constants/api-routes";
// hoc
import withAuthWrapper from "lib/hoc/withAuthWrapper";
// layouts
import DefaultLayout from "layouts/DefaultLayout";
// ui
import { Button, Spinner } from "ui";
// types
import type { IWorkspaceInvitation } from "types";
import { ChartBarIcon, ChevronRightIcon, CubeIcon, PlusIcon } from "@heroicons/react/24/outline";
import { EmptySpace, EmptySpaceItem } from "ui/EmptySpace";

const OnBoard: NextPage = () => {
  const [canRedirect, setCanRedirect] = useState(true);
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
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // useEffect(() => {
  //   if (!invitations) return;
  //   else
  //     invitations.forEach((invite) => {
  //       if (invite.accepted)
  //         setInvitationsRespond((prevData) => {
  //           return [...prevData, invite.workspace.id];
  //         });
  //     });
  // }, [invitations, router, workspaces]);

  useEffect(() => {
    if (workspaces && workspaces.length === 0) {
      setCanRedirect(false);
    }
  }, [workspaces]);

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
          {invitations ? (
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
                          {/* <div className="h-full flex items-center gap-x-1">
                            <input
                              id={`${item.id}`}
                              aria-describedby="workspaces"
                              name={`${item.id}`}
                              checked={invitationsRespond.includes(item.workspace.id)}
                              value={item.workspace.name}
                              onChange={() => {
                                handleInvitation(item, invitationsRespond.includes(item.workspace.id) ? "withdraw" : "accepted");
                              }}
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor={item.id} className="text-sm">
                              Reject
                            </label>
                          </div> */}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between mt-4">
                  <Button className="w-full" onClick={submitInvitations}>
                    Continue to Dashboard
                  </Button>
                </div>
              </div>
            ) : (
              <EmptySpace
                title={`${
                  canRedirect
                    ? `You haven't been invited to any workspace yet.`
                    : "You don't have any workspaces, Start by creating one."
                }`}
                description="Your workspace is where you'll create projects, collaborate on your issues, and organize different streams of work in your Plane account."
              >
                <EmptySpaceItem
                  Icon={canRedirect ? CubeIcon : PlusIcon}
                  title={canRedirect ? "Continue to Dashboard" : "Create your Workspace"}
                  action={() => {
                    userService.updateUserOnBoard().then((response) => {
                      console.log(response);
                    });
                    router.push(canRedirect ? "/" : "/create-workspace");
                  }}
                />
              </EmptySpace>
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

export default withAuthWrapper(OnBoard);
