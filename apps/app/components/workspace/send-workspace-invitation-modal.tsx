import React from "react";
import { mutate } from "swr";
import { useForm } from "react-hook-form";
// headless
import { Dialog, Transition } from "@headlessui/react";
// services
import workspaceService from "services/workspace.service";
// ui
import { Button, Input, Select } from "components/ui";
// hooks
import useToast from "hooks/use-toast";
// types
import { IWorkspaceMemberInvitation } from "types";
// fetch keys
import { WORKSPACE_INVITATIONS } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  workspace_slug: string;
  members: any[];
};

const ROLE = {
  5: "Guest",
  10: "Viewer",
  15: "Member",
  20: "Admin",
};

const defaultValues: Partial<IWorkspaceMemberInvitation> = {
  email: "",
  role: 5,
};

const SendWorkspaceInvitationModal: React.FC<Props> = ({
  isOpen,
  setIsOpen,
  workspace_slug,
  members,
}) => {
  const { setToastAlert } = useToast();

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<IWorkspaceMemberInvitation>({
    defaultValues,
    reValidateMode: "onChange",
    mode: "all",
  });

  const handleClose = () => {
    setIsOpen(false);
    reset(defaultValues);
  };

  const onSubmit = async (formData: IWorkspaceMemberInvitation) => {
    await workspaceService
      .inviteWorkspace(workspace_slug, { emails: [formData] })
      .then((res) => {
        console.log(res);
        setIsOpen(false);
        handleClose();
        mutate(WORKSPACE_INVITATIONS, (prevData: any) => [
          { ...res, ...formData },
          ...(prevData ?? []),
        ]);
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Member invited successfully",
        });
      })
      .catch((err) => console.log(err));
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-5 py-8 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Members
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Invite members to work on your workspace.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Input
                          id="email"
                          label="Email"
                          name="email"
                          type="email"
                          placeholder="Enter email"
                          error={errors.email}
                          register={register}
                          validations={{
                            required: "Email is required",
                            validate: (value) => {
                              if (members.find((member) => member.email === value))
                                return "Email already exist";
                            },
                          }}
                        />
                      </div>
                      <div>
                        <Select
                          id="role"
                          label="Role"
                          name="role"
                          error={errors.role}
                          register={register}
                          validations={{
                            required: "Role is required",
                          }}
                          options={Object.entries(ROLE).map(([key, value]) => ({
                            value: key,
                            label: value,
                          }))}
                        />
                      </div>
                      {/* <div>
                        <TextArea
                          id="message"
                          name="message"
                          label="Message"
                          placeholder="Enter message"
                          error={errors.message}
                          register={register}
                        />
                      </div> */}
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <Button theme="secondary" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Sending Invitation..." : "Send Invitation"}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default SendWorkspaceInvitationModal;
