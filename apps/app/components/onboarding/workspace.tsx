import { useState } from "react";

import useSWR from "swr";

// headless ui
import { Tab } from "@headlessui/react";
// services
import workspaceService from "services/workspace.service";
// types
import { ICurrentUserResponse, IWorkspaceMemberInvitation } from "types";
// fetch-keys
import { USER_WORKSPACE_INVITATIONS } from "constants/fetch-keys";
// constants
import { CreateWorkspaceForm } from "components/workspace";
// ui
import { PrimaryButton } from "components/ui";
import { getFirstCharacters, truncateText } from "helpers/string.helper";

type Props = {
  setStep: React.Dispatch<React.SetStateAction<number | null>>;
  setWorkspace: React.Dispatch<React.SetStateAction<any>>;
  user: ICurrentUserResponse | undefined;
};

const tabsList = ["New Workspace", "Invited Workspaces"];

export const Workspace: React.FC<Props> = ({ setStep, setWorkspace, user }) => {
  const [isJoiningWorkspaces, setIsJoiningWorkspaces] = useState(false);
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);
  const [defaultValues, setDefaultValues] = useState({
    name: "",
    slug: "",
    company_size: null,
  });

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
    <div className="w-full mt-6">
      <div className="space-y-9">
        <h4 className="text-xl font-semibold">Create your workspace.</h4>
        <Tab.Group as="div">
          <Tab.List as="div" className="text-gray-8 flex items-center justify-start gap-3 text-sm">
            {tabsList.map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  `rounded-3xl border px-4 py-2 outline-none ${
                    selected
                      ? "border-brand-accent bg-brand-accent text-white font-medium"
                      : "border-brand-base bg-brand-base hover:bg-brand-surface-2"
                  }`
                }
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels as="div">
            <Tab.Panel className="mt-9 md:w-1/3">
              <CreateWorkspaceForm
                onSubmit={(res) => {
                  setWorkspace(res);
                  setStep(3);
                }}
                defaultValues={defaultValues}
                setDefaultValues={setDefaultValues}
                user={user}
              />
            </Tab.Panel>
            <Tab.Panel className="mt-9 space-y-9 md:w-1/2">
              <div className="overflow-y-auto">
                {invitations && invitations.length > 0 ? (
                  invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="group relative flex cursor-pointer items-start space-x-3 border-2 border-transparent py-4"
                    >
                      <div className="flex-shrink-0">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg">
                          {invitation.workspace.logo && invitation.workspace.logo !== "" ? (
                            <img
                              src={invitation.workspace.logo}
                              height="100%"
                              width="100%"
                              className="rounded"
                              alt={invitation.workspace.name}
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center rounded-xl bg-gray-700 p-4 uppercase text-white">
                              {getFirstCharacters(invitation.workspace.name)}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">
                          {truncateText(invitation.workspace.name, 30)}
                        </div>
                        <p className="text-sm text-brand-secondary">
                          Invited by{" "}
                          {invitation.created_by_detail
                            ? invitation.created_by_detail.first_name
                            : invitation.workspace.owner.first_name}
                        </p>
                      </div>
                      <div className="flex-shrink-0 self-center">
                        <button
                          className={`${
                            invitationsRespond.includes(invitation.id)
                              ? "bg-brand-surface-2 text-brand-secondary"
                              : "bg-brand-accent text-white"
                          } text-sm px-4 py-2 border border-brand-base rounded-3xl`}
                          onClick={(e) => {
                            handleInvitation(
                              invitation,
                              invitationsRespond.includes(invitation.id) ? "withdraw" : "accepted"
                            );
                          }}
                        >
                          {invitationsRespond.includes(invitation.id)
                            ? "Invitation Accepted"
                            : "Accept Invitation"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center">
                    <h3 className="text-brand-secondary">{`You don't have any invitations yet.`}</h3>
                  </div>
                )}
              </div>
              <PrimaryButton
                type="submit"
                size="md"
                onClick={submitInvitations}
                disabled={isJoiningWorkspaces || invitationsRespond.length === 0}
              >
                Join Workspace
              </PrimaryButton>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};
