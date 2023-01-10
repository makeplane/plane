// FIXME: remove this page

import React, { useState } from "react";
// next
import Link from "next/link";
import type { NextPage } from "next";
import { useRouter } from "next/router";
// services
import workspaceService from "lib/services/workspace.service";
// hoc
import withAuthWrapper from "lib/hoc/withAuthWrapper";
// layouts
import AppLayout from "layouts/app-layout";
// ui
import { Button } from "ui";
// swr
import useSWR from "swr";
import { USER_WORKSPACES } from "constants/fetch-keys";

const MyWorkspacesInvites: NextPage = () => {
  const router = useRouter();

  const [invitationsRespond, setInvitationsRespond] = useState<any>([]);

  const { data: workspaces } = useSWR(USER_WORKSPACES, () => workspaceService.userWorkspaces(), {
    shouldRetryOnError: false,
  });

  const { data: workspaceInvitations, mutate: mutateInvitations } = useSWR<any[]>(
    "WORKSPACE_INVITATIONS",
    () => workspaceService.userWorkspaceInvitations()
  );

  const handleInvitation = (workspace_invitation: any, action: string) => {
    if (action === "accepted") {
      setInvitationsRespond((prevData: any) => {
        return [...prevData, workspace_invitation.workspace.id];
      });
    } else if (action === "withdraw") {
      setInvitationsRespond((prevData: any) => {
        return prevData.filter((item: string) => item !== workspace_invitation.workspace.id);
      });
    }
  };

  const submitInvitations = () => {
    workspaceService
      .joinWorkspaces({ workspace_ids: invitationsRespond })
      .then(async (res) => {
        console.log(res);
        await mutateInvitations();

        router.push("/");
      })
      .catch((err: any) => console.log);
  };

  return (
    <AppLayout
      meta={{
        title: "Plane - My Workspace Invites",
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="relative rounded bg-gray-50 px-4 pt-5 pb-4 text-left shadow sm:w-full sm:max-w-2xl sm:p-6">
          {(workspaceInvitations as any)?.length > 0 ? (
            <>
              <div>
                <div className="mt-3 sm:mt-5">
                  <div className="mt-2">
                    <h2 className="mb-4 text-lg">Workspace Invitations</h2>
                    <div className="space-y-2">
                      {workspaceInvitations?.map((item: any) => (
                        <div className="relative flex items-start" key={item.id}>
                          <div className="flex h-5 items-center">
                            <input
                              id={`${item.id}`}
                              aria-describedby="workspaces"
                              name={`${item.id}`}
                              checked={
                                item.workspace.accepted ||
                                invitationsRespond.includes(item.workspace.id)
                              }
                              value={item.workspace.name}
                              onChange={() =>
                                handleInvitation(
                                  item,
                                  item.accepted
                                    ? "withdraw"
                                    : invitationsRespond.includes(item.workspace.id)
                                    ? "withdraw"
                                    : "accepted"
                                )
                              }
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-theme focus:ring-indigo-500"
                            />
                          </div>
                          <div className="ml-3 flex w-full justify-between text-sm">
                            <label htmlFor={`${item.id}`} className="font-medium text-gray-700">
                              {item.workspace.name}
                            </label>
                            <div>
                              {invitationsRespond.includes(item.workspace.id) ? (
                                <div className="flex gap-x-2">
                                  <p>Accepted</p>
                                  <button
                                    type="button"
                                    onClick={() => handleInvitation(item, "withdraw")}
                                  >
                                    Withdraw
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleInvitation(item, "accepted")}
                                >
                                  Join
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-between">
                <Link href={workspaces?.length === 0 ? "/create-workspace" : "/"}>
                  <button type="button" className="text-sm text-gray-700">
                    Skip
                  </button>
                </Link>

                <Button onClick={submitInvitations}>Submit</Button>
              </div>
            </>
          ) : (
            <div>
              <span>No Invitaions Found</span>
              <p>
                <Link href="/">
                  <a>Click Here </a>
                </Link>

                <span>to redirect home</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default withAuthWrapper(MyWorkspacesInvites);
