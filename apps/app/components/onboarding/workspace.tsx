import { useState } from "react";

import Image from "next/image";

import useSWR from "swr";

// headless ui
import { Tab } from "@headlessui/react";
// services
import workspaceService from "services/workspace.service";
// types
import { IWorkspaceMemberInvitation } from "types";
// fetch-keys
import { USER_WORKSPACE_INVITATIONS } from "constants/fetch-keys";
// constants
import { CreateWorkspaceForm } from "components/workspace";

type Props = {
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setWorkspace: React.Dispatch<React.SetStateAction<any>>;
};

const Workspace: React.FC<Props> = ({ setStep, setWorkspace }) => {
  const [isJoiningWorkspaces, setIsJoiningWorkspaces] = useState(false);
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);

  const { data: invitations, mutate } = useSWR(USER_WORKSPACE_INVITATIONS, () =>
    workspaceService.userWorkspaceInvitations()
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

  const submitInvitations = async () => {
    if (invitationsRespond.length <= 0) return;
    setIsJoiningWorkspaces(true);
    await workspaceService
      .joinWorkspaces({ invitations: invitationsRespond })
      .then(async () => {
        await mutate();
        setStep(4);
        setIsJoiningWorkspaces(false);
      })
      .catch((err) => {
        console.error(err);
        setIsJoiningWorkspaces(false);
      });
  };

  return (
    <div className="grid w-full place-items-center">
      <Tab.Group as="div" className="w-full rounded-lg bg-white p-8 md:w-2/5">
        <Tab.List
          as="div"
          className="grid grid-cols-2 items-center gap-2 rounded-lg bg-gray-100 p-2 text-sm"
        >
          <Tab
            className={({ selected }) =>
              `rounded-lg px-6 py-2 ${selected ? "bg-gray-300" : "hover:bg-gray-200"}`
            }
          >
            New workspace
          </Tab>
          <Tab
            className={({ selected }) =>
              `rounded-lg px-6 py-2 ${selected ? "bg-gray-300" : "hover:bg-gray-200"}`
            }
          >
            Invited workspaces
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel className="pt-4">
            <CreateWorkspaceForm
              onSubmit={(res) => {
                setWorkspace(res);
                setStep(3);
              }}
            />
          </Tab.Panel>
          <Tab.Panel>
            <div className="mt-4 space-y-8">
              <div className="divide-y">
                {invitations && invitations.length > 0 ? (
                  invitations.map((invitation) => (
                    <div key={invitation.id}>
                      <label
                        className={`group relative flex cursor-pointer items-start space-x-3 border-2 border-transparent py-4`}
                        htmlFor={invitation.id}
                      >
                        <div className="flex-shrink-0">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg">
                            {invitation.workspace.logo && invitation.workspace.logo !== "" ? (
                              <Image
                                src={invitation.workspace.logo}
                                height="100%"
                                width="100%"
                                className="rounded"
                                alt={invitation.workspace.name}
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center rounded bg-gray-500 p-4 uppercase text-white">
                                {invitation.workspace.name.charAt(0)}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {invitation.workspace.name}
                          </div>
                          <p className="text-sm text-gray-500">
                            Invited by {invitation.workspace.owner.first_name}
                          </p>
                        </div>
                        <div className="flex-shrink-0 self-center">
                          <input
                            id={invitation.id}
                            aria-describedby="workspaces"
                            name={invitation.id}
                            checked={invitationsRespond.includes(invitation.id)}
                            value={invitation.workspace.name}
                            onChange={(e) => {
                              handleInvitation(
                                invitation,
                                invitationsRespond.includes(invitation.id) ? "withdraw" : "accepted"
                              );
                            }}
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-theme focus:ring-indigo-500"
                          />
                        </div>
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="text-center">
                    <h3 className="text-gray-400">You have no invitations</h3>
                  </div>
                )}
              </div>
              <div className="mx-auto h-1/4 lg:w-1/2">
                <button
                  type="submit"
                  className={`w-full rounded-md bg-gray-200 px-4 py-2 text-sm ${
                    isJoiningWorkspaces || invitationsRespond.length === 0
                      ? "cursor-not-allowed opacity-80"
                      : ""
                  }`}
                  disabled={isJoiningWorkspaces || invitationsRespond.length === 0}
                  onClick={submitInvitations}
                >
                  Join Workspace
                </button>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default Workspace;
