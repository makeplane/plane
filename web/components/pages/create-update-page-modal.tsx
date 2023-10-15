import React from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import { PageService } from "services/page.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { PageForm } from "./page-form";
// types
import { IUser, IPage } from "types";
// fetch-keys
import { ALL_PAGES_LIST, FAVORITE_PAGES_LIST, MY_PAGES_LIST, RECENT_PAGES_LIST } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: IPage | null;
  user: IUser | undefined;
};

// services
const pageService = new PageService();

export const CreateUpdatePageModal: React.FC<Props> = ({ isOpen, handleClose, data, user }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const onClose = () => {
    handleClose();
  };

  const createPage = async (payload: IPage) => {
    await pageService
      .createPage(workspaceSlug as string, projectId as string, payload, user)
      .then((res) => {
        mutate(RECENT_PAGES_LIST(projectId as string));
        mutate<IPage[]>(
          MY_PAGES_LIST(projectId as string),
          (prevData) => {
            if (!prevData) return undefined;

            return [res, ...(prevData as IPage[])];
          },
          false
        );
        mutate<IPage[]>(
          ALL_PAGES_LIST(projectId as string),
          (prevData) => {
            if (!prevData) return undefined;

            return [res, ...(prevData as IPage[])];
          },
          false
        );
        onClose();

        router.push(`/${workspaceSlug}/projects/${projectId}/pages/${res.id}`);

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Page created successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page could not be created. Please try again.",
        });
      });
  };

  const updatePage = async (payload: IPage) => {
    await pageService
      .patchPage(workspaceSlug as string, projectId as string, data?.id ?? "", payload, user)
      .then((res) => {
        mutate(RECENT_PAGES_LIST(projectId as string));
        mutate<IPage[]>(
          FAVORITE_PAGES_LIST(projectId as string),
          (prevData) =>
            (prevData ?? []).map((p) => {
              if (p.id === res.id) return { ...p, ...res };

              return p;
            }),
          false
        );
        mutate<IPage[]>(
          MY_PAGES_LIST(projectId as string),
          (prevData) =>
            (prevData ?? []).map((p) => {
              if (p.id === res.id) return { ...p, ...res };

              return p;
            }),
          false
        );
        mutate<IPage[]>(
          ALL_PAGES_LIST(projectId as string),
          (prevData) =>
            (prevData ?? []).map((p) => {
              if (p.id === res.id) return { ...p, ...res };

              return p;
            }),
          false
        );
        onClose();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Page updated successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page could not be updated. Please try again.",
        });
      });
  };

  const handleFormSubmit = async (formData: IPage) => {
    if (!workspaceSlug || !projectId) return;

    if (!data) await createPage(formData);
    else await updatePage(formData);
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
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
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
              <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-100 px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <PageForm
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
