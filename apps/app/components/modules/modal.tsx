import React, { useEffect } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// components
import { ModuleForm } from "components/modules";
// services
import modulesService from "services/modules.service";
// hooks
import useToast from "hooks/use-toast";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";
// types
import type { IModule } from "types";
// fetch-keys
import { MODULE_LIST } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data?: IModule;
};

const defaultValues: Partial<IModule> = {
  name: "",
  description: "",
  status: null,
  lead: null,
  members_list: [],
};

export const CreateUpdateModuleModal: React.FC<Props> = ({ isOpen, setIsOpen, data }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const handleClose = () => {
    setIsOpen(false);
    reset(defaultValues);
  };

  const { reset, setError } = useForm<IModule>({
    defaultValues,
  });

  const createModule = async (payload: Partial<IModule>) => {
    await modulesService
      .createModule(workspaceSlug as string, projectId as string, payload)
      .then(() => {
        mutate(MODULE_LIST(projectId as string));
        handleClose();

        setToastAlert({
          title: "Success",
          type: "success",
          message: "Module created successfully",
        });
      })
      .catch((err) => {
        Object.keys(err).map((key) => {
          setError(key as keyof typeof defaultValues, {
            message: err[key].join(", "),
          });
        });
      });
  };

  const updateModule = async (payload: Partial<IModule>) => {
    await modulesService
      .updateModule(workspaceSlug as string, projectId as string, data?.id ?? "", payload)
      .then((res) => {
        mutate<IModule[]>(
          MODULE_LIST(projectId as string),
          (prevData) => {
            const newData = prevData?.map((item) => {
              if (item.id === res.id) {
                return res;
              }
              return item;
            });
            return newData;
          },
          false
        );
        handleClose();

        setToastAlert({
          title: "Success",
          type: "success",
          message: "Module updated successfully",
        });
      })
      .catch((err) => {
        Object.keys(err).map((key) => {
          setError(key as keyof typeof defaultValues, {
            message: err[key].join(", "),
          });
        });
      });
  };

  const handleFormSubmit = async (formData: Partial<IModule>) => {
    if (!workspaceSlug || !projectId) return;

    const payload: Partial<IModule> = {
      ...formData,
    };

    if (!data) await createModule(payload);
    else await updateModule(payload);
  };

  useEffect(() => {
    if (data) {
      setIsOpen(true);
      reset(data);
    } else {
      reset(defaultValues);
    }
  }, [data, setIsOpen, reset]);

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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
              <Dialog.Panel className="relative transform rounded-lg bg-white px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <ModuleForm
                  handleFormSubmit={handleFormSubmit}
                  handleClose={handleClose}
                  status={data ? true : false}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
