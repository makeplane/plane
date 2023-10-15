import { Fragment } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { useForm } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
// components
import { ModuleForm } from "components/modules";
// services
import { ModuleService } from "services/module.service";
// hooks
import useToast from "hooks/use-toast";
// types
import type { IUser, IModule } from "types";
// fetch-keys
import { MODULE_LIST } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data?: IModule;
  user: IUser | undefined;
};

const defaultValues: Partial<IModule> = {
  name: "",
  description: "",
  status: "backlog",
  lead: null,
  members_list: [],
};

const moduleService = new ModuleService();

export const CreateUpdateModuleModal: React.FC<Props> = ({ isOpen, setIsOpen, data, user }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const handleClose = () => {
    setIsOpen(false);
    reset(defaultValues);
  };

  const { reset } = useForm<IModule>({
    defaultValues,
  });

  const createModule = async (payload: Partial<IModule>) => {
    await moduleService
      .createModule(workspaceSlug as string, projectId as string, payload, user)
      .then(() => {
        mutate(MODULE_LIST(projectId as string));
        handleClose();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Module created successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Module could not be created. Please try again.",
        });
      });
  };

  const updateModule = async (payload: Partial<IModule>) => {
    await moduleService
      .updateModule(workspaceSlug as string, projectId as string, data?.id ?? "", payload, user)
      .then((res) => {
        mutate<IModule[]>(
          MODULE_LIST(projectId as string),
          (prevData) =>
            prevData?.map((p) => {
              if (p.id === res.id) return { ...p, ...payload };

              return p;
            }),
          false
        );
        handleClose();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Module updated successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Module could not be updated. Please try again.",
        });
      });
  };

  const handleFormSubmit = async (formData: Partial<IModule>) => {
    if (!workspaceSlug || !projectId) return;

    const payload: Partial<IModule> = {
      ...formData,
      members_list: formData.members,
    };

    if (!data) await createModule(payload);
    else await updateModule(payload);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-100 px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <ModuleForm
                  handleFormSubmit={handleFormSubmit}
                  handleClose={handleClose}
                  status={data ? true : false}
                  data={data}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
