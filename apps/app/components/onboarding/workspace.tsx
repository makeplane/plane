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
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setWorkspace: React.Dispatch<React.SetStateAction<any>>;
  user: ICurrentUserResponse | undefined;
};

export const Workspace: React.FC<Props> = ({ setStep, setWorkspace, user }) => {
  const [isJoiningWorkspaces, setIsJoiningWorkspaces] = useState(false);
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);
  const [defaultValues, setDefaultValues] = useState({
    name: "",
    slug: "",
    company_size: null,
  });
  const [currentTab, setCurrentTab] = useState("create");

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

  const currentTabValue = (tab: string | null) => {
    switch (tab) {
      case "join":
        return 0;
      case "create":
        return 1;
      default:
        return 1;
    }
  };

  console.log("invitations:", invitations);

  return (
    <div className="grid w-full place-items-center">
      <Tab.Group
        as="div"
        className="flex h-[417px] w-full max-w-xl flex-col justify-between rounded-[10px] bg-brand-base shadow-md"
        defaultIndex={currentTabValue(currentTab)}
        onChange={(i) => {
          switch (i) {
            case 0:
              return setCurrentTab("join");
            case 1:
              return setCurrentTab("create");
            default:
              return setCurrentTab("create");
          }
        }}
      >
        <Tab.List as="div" className="flex flex-col gap-3 px-7 pt-7 pb-3.5">
          <div className="flex flex-col gap-2 justify-center">
            <h3 className="text-base font-semibold text-brand-base">Workspace</h3>
            <p className="text-sm text-brand-secondary">
              Create or join the workspace to get started with Plane.
            </p>
          </div>
          <div className="text-gray-8 flex items-center justify-start gap-3  text-sm">
            <Tab
              className={({ selected }) =>
                `rounded-3xl border px-4 py-2 outline-none ${
                  selected
                    ? "border-brand-accent bg-brand-accent text-white font-medium"
                    : "border-brand-base bg-brand-base hover:bg-brand-surface-2"
                }`
              }
            >
              Invited Workspace
            </Tab>
            <Tab
              className={({ selected }) =>
                `rounded-3xl border px-4 py-2 outline-none ${
                  selected
                    ? "border-brand-accent bg-brand-accent text-white font-medium"
                    : "border-brand-base bg-brand-base hover:bg-brand-surface-2"
                }`
              }
            >
              New Workspace
            </Tab>
          </div>
        </Tab.List>
        <Tab.Panels as="div" className="h-full">
          <Tab.Panel className="h-full">
            <div className="flex h-full w-full flex-col">
              <div className="h-[255px] overflow-y-auto px-7">
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
                          {/* <input
                            id={invitation.id}
                            aria-describedby="workspaces"
                            name={invitation.id}
                            value={
                              invitationsRespond.includes(invitation.id)
                                ? "Invitation Accepted"
                                : "Accept Invitation"
                            }
                            onClick={(e) => {
                              handleInvitation(
                                invitation,
                                invitationsRespond.includes(invitation.id) ? "withdraw" : "accepted"
                              );
                            }}
                            type="button"
                            className={`${
                              invitationsRespond.includes(invitation.id)
                                ? "bg-brand-surface-2 text-brand-secondary"
                                : "bg-brand-accent text-white"
                            } text-sm px-4 py-2 border border-brand-base rounded-3xl`}

                            // className="h-4 w-4 rounded border-brand-base text-brand-accent focus:ring-brand-accent"
                          /> */}
                        </div>
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="text-center">
                    <h3 className="text-brand-secondary">{`You don't have any invitations yet.`}</h3>
                  </div>
                )}
              </div>
              <div className="flex w-full items-center justify-center rounded-b-[10px] pt-10">
                <PrimaryButton
                  type="submit"
                  className="w-1/2 text-center"
                  size="md"
                  disabled={isJoiningWorkspaces || invitationsRespond.length === 0}
                  onClick={submitInvitations}
                >
                  Join Workspace
                </PrimaryButton>
              </div>
            </div>
          </Tab.Panel>
          <Tab.Panel className="h-full">
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
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};
