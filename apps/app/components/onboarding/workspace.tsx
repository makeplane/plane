// react
import { useEffect, useState } from "react";
// next
import Image from "next/image";
// swr
import useSWR from "swr";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
// hooks
import useToast from "lib/hooks/useToast";
// services
import workspaceService from "lib/services/workspace.service";
// headless ui
import { Tab } from "@headlessui/react";
// ui
import { CustomSelect, Input } from "ui";
// fetch-keys
import { USER_WORKSPACE_INVITATIONS } from "constants/fetch-keys";
// types
import { IWorkspace, IWorkspaceMemberInvitation } from "types";

type Props = {
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setWorkspace: React.Dispatch<React.SetStateAction<any>>;
};

const Workspace: React.FC<Props> = ({ setStep, setWorkspace }) => {
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);

  const { setToastAlert } = useToast();

  const { data: invitations, mutate } = useSWR(USER_WORKSPACE_INVITATIONS, () =>
    workspaceService.userWorkspaceInvitations()
  );

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IWorkspace>();

  const handleCreateWorkspace = (formData: IWorkspace) => {
    console.log(formData);

    workspaceService
      .workspaceNameCheck(formData.name)
      .then((res) => {
        if (res.status === true) {
          workspaceService
            .createWorkspace(formData)
            .then((res) => {
              console.log(res);
              setToastAlert({
                type: "success",
                title: "Workspace created successfully!",
              });
              setWorkspace(res);
              setStep(3);
            })
            .catch((err) => {
              console.log(err);
            });
        } else {
          setError("name", { message: "Workspace name is already taken!" });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

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
    workspaceService
      .joinWorkspaces({ invitations: invitationsRespond })
      .then(async (res: any) => {
        console.log(res);
        await mutate();
        setStep(4);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    reset({
      name: "",
      slug: "",
      company_size: null,
    });
  }, [reset]);

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
          <Tab.Panel>
            <form className="mt-4 space-y-8" onSubmit={handleSubmit(handleCreateWorkspace)}>
              <div className="w-full space-y-4 bg-white">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Input
                      label="Workspace name"
                      name="name"
                      placeholder="Enter name"
                      autoComplete="off"
                      register={register}
                      validations={{
                        required: "Workspace name is required",
                      }}
                      error={errors.name}
                    />
                  </div>
                  <div className="flex items-center rounded-md border px-3">
                    <span className="text-sm text-slate-600">{"https://app.plane.so/"}</span>
                    <input
                      type="text"
                      value={
                        watch("name")
                          ? `${watch("name").toLocaleLowerCase().replace(/ /g, "-")}`
                          : ""
                      }
                      autoComplete="off"
                      {...(register &&
                        register("slug", {
                          required: "Workspace URL is required",
                        }))}
                      className="block w-full rounded-md bg-transparent py-2 text-sm  focus:outline-none"
                    />
                  </div>
                  <div>
                    <Controller
                      name="company_size"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          {...field}
                          label={field.value ? field.value.toString() : "Select company size"}
                          input
                        >
                          {[
                            { value: 5, label: "5" },
                            { value: 10, label: "10" },
                            { value: 25, label: "25" },
                            { value: 50, label: "50" },
                          ]?.map((item) => (
                            <CustomSelect.Option key={item.value} value={item.value}>
                              {item.label}
                            </CustomSelect.Option>
                          ))}
                        </CustomSelect>
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="mx-auto h-1/4 lg:w-1/2">
                <button
                  type="submit"
                  className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Continue"}
                </button>
              </div>
            </form>
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
                  className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm"
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
