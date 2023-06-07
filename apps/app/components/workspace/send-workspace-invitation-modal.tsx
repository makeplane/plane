import React from "react";
import { mutate } from "swr";
import { Controller, useForm } from "react-hook-form";
// headless
import { Dialog, Transition } from "@headlessui/react";
// services
import workspaceService from "services/workspace.service";
// ui
import { CustomSelect, Input, PrimaryButton, SecondaryButton } from "components/ui";
// hooks
import useToast from "hooks/use-toast";
// types
import { ICurrentUserResponse, IWorkspaceMemberInvitation } from "types";
// fetch keys
import { WORKSPACE_INVITATIONS } from "constants/fetch-keys";
// constants
import { ROLE } from "constants/workspace";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  workspace_slug: string;
  members: any[];
  user: ICurrentUserResponse | undefined;
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
  user,
}) => {
  const { setToastAlert } = useToast();

  const {
    control,
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<IWorkspaceMemberInvitation>({
    defaultValues,
    reValidateMode: "onChange",
  });

  const handleClose = () => {
    setIsOpen(false);
    reset(defaultValues);
  };

  const onSubmit = async (formData: IWorkspaceMemberInvitation) => {
    await workspaceService
      .inviteWorkspace(workspace_slug, { emails: [formData] }, user)
      .then((res) => {
        setIsOpen(false);
        handleClose();
        mutate(WORKSPACE_INVITATIONS, (prevData: any) => [
          { ...res, ...formData },
          ...(prevData ?? []),
        ]);
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Member invited successfully.",
        });
      })
      .catch((err) => console.log(err));
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[#131313] bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
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
              <Dialog.Panel className="relative transform rounded-lg bg-brand-surface-1 p-5 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    <div>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-brand-base"
                      >
                        Members
                      </Dialog.Title>
                      <p className="text-sm text-brand-secondary">
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
                        <Controller
                          control={control}
                          rules={{ required: true }}
                          name="role"
                          render={({ field: { value, onChange } }) => (
                            <CustomSelect
                              value={value}
                              label={ROLE[value]}
                              onChange={onChange}
                              width="w-full"
                              input
                            >
                              {Object.entries(ROLE).map(([key, value]) => (
                                <CustomSelect.Option key={key} value={key}>
                                  {value}
                                </CustomSelect.Option>
                              ))}
                            </CustomSelect>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" loading={isSubmitting}>
                      {isSubmitting ? "Sending Invitation..." : "Send Invitation"}
                    </PrimaryButton>
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
