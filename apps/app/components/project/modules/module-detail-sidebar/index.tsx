// react
import { useEffect, useState } from "react";
// swr
import useSWR, { mutate } from "swr";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
// services
import modulesService from "lib/services/modules.service";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// components
import SelectMembers from "components/project/modules/module-detail-sidebar/select-members";
import SelectStatus from "components/project/modules/module-detail-sidebar/select-status";
// ui
import { Spinner } from "ui";
// icons
import {
  CalendarDaysIcon,
  ClipboardDocumentIcon,
  LinkIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
// types
import { IModule } from "types";
// fetch-keys
import { MODULE_DETAIL } from "constants/fetch-keys";
// common
import { copyTextToClipboard } from "constants/common";
import ModuleLinkModal from "../module-link-modal";
import Link from "next/link";

const defaultValues: Partial<IModule> = {
  members_list: [],
  start_date: new Date().toString(),
  target_date: new Date().toString(),
  status: null,
};

type Props = {
  module?: IModule;
  isOpen: boolean;
  handleDeleteModule: () => void;
};

const ModuleDetailSidebar: React.FC<Props> = ({ module, isOpen, handleDeleteModule }) => {
  const [moduleLinkModal, setModuleLinkModal] = useState(false);

  const { activeWorkspace, activeProject } = useUser();

  const { setToastAlert } = useToast();

  const { reset, watch, control } = useForm({
    defaultValues,
  });

  const submitChanges = (data: Partial<IModule>) => {
    if (!activeWorkspace || !activeProject || !module) return;

    modulesService
      .patchModule(activeWorkspace.slug, activeProject.id, module.id, data)
      .then((res) => {
        console.log(res);
        mutate(MODULE_DETAIL);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  useEffect(() => {
    if (module)
      reset({
        ...module,
        members_list: module.members_list ?? module.members_detail?.map((m) => m.id),
      });
  }, [module, reset]);

  return (
    <>
      <ModuleLinkModal
        isOpen={moduleLinkModal}
        handleClose={() => setModuleLinkModal(false)}
        module={module}
      />
      <div
        className={`fixed top-0 ${
          isOpen ? "right-0" : "-right-[24rem]"
        } z-20 bg-gray-50 border-l h-full p-5 w-[24rem] overflow-y-auto duration-300`}
      >
        {module ? (
          <>
            <div className="flex justify-between items-center pb-3">
              <h4 className="text-sm font-medium">{module.name}</h4>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 duration-300"
                  onClick={() =>
                    copyTextToClipboard(
                      `https://app.plane.so/projects/${activeProject?.id}/modules/${module.id}`
                    )
                      .then(() => {
                        setToastAlert({
                          type: "success",
                          title: "Copied to clipboard",
                        });
                      })
                      .catch(() => {
                        setToastAlert({
                          type: "error",
                          title: "Some error occurred",
                        });
                      })
                  }
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 duration-300"
                  onClick={() =>
                    copyTextToClipboard(module.id)
                      .then(() => {
                        setToastAlert({
                          type: "success",
                          title: "Copied to clipboard",
                        });
                      })
                      .catch(() => {
                        setToastAlert({
                          type: "error",
                          title: "Some error occurred",
                        });
                      })
                  }
                >
                  <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-red-50 text-red-500 border border-red-500 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 duration-300"
                  onClick={() => handleDeleteModule()}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="divide-y-2 divide-gray-100 text-xs">
              <div className="py-1">
                <div className="flex items-center py-2 flex-wrap">
                  <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
                    <UserIcon className="flex-shrink-0 h-4 w-4" />
                    <p>Lead</p>
                  </div>
                  <div className="sm:basis-1/2">
                    {module.lead_detail.first_name !== "" ? (
                      <>
                        {module.lead_detail.first_name} {module.lead_detail.last_name}
                      </>
                    ) : (
                      module.lead_detail.email
                    )}
                  </div>
                </div>
                <SelectMembers control={control} submitChanges={submitChanges} />
              </div>
              <div className="py-1">
                <div className="flex items-center py-2 flex-wrap">
                  <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
                    <CalendarDaysIcon className="flex-shrink-0 h-4 w-4" />
                    <p>Start date</p>
                  </div>
                  <div className="sm:basis-1/2">
                    <Controller
                      control={control}
                      name="start_date"
                      render={({ field: { value, onChange } }) => (
                        <input
                          type="date"
                          id="issueDate"
                          value={value ?? ""}
                          onChange={onChange}
                          className="hover:bg-gray-100 bg-transparent border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300 w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="flex items-center py-2 flex-wrap">
                  <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
                    <CalendarDaysIcon className="flex-shrink-0 h-4 w-4" />
                    <p>End date</p>
                  </div>
                  <div className="sm:basis-1/2">
                    <Controller
                      control={control}
                      name="target_date"
                      render={({ field: { value, onChange } }) => (
                        <input
                          type="date"
                          value={value ?? ""}
                          onChange={(e: any) => {
                            submitChanges({ target_date: e.target.value });
                            onChange(e.target.value);
                          }}
                          className="hover:bg-gray-100 bg-transparent border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300 w-full"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="py-1">
                <SelectStatus control={control} submitChanges={submitChanges} watch={watch} />
              </div>
              <div className="py-1">
                <div className="flex justify-between items-center gap-2">
                  <h4>Links</h4>
                  <button
                    type="button"
                    className="h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-100 duration-300 outline-none"
                    onClick={() => setModuleLinkModal(true)}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {module.link_module.length > 0
                    ? module.link_module.map((link) => (
                        <div key={link.id} className="group relative">
                          <div className="opacity-0 group-hover:opacity-100 absolute top-1.5 right-1.5 z-10">
                            <button
                              type="button"
                              className="h-7 w-7 p-1 grid place-items-center rounded text-red-500 bg-gray-100 hover:bg-red-50 duration-300 outline-none"
                              onClick={() => {
                                const updatedLinks = module.link_module.filter(
                                  (l) => l.id !== link.id
                                );
                                submitChanges({ links_list: updatedLinks });
                              }}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <Link href={link.url} target="_blank">
                            <a className="group relative flex gap-2 border bg-gray-100 rounded-md p-2">
                              <div className="mt-0.5">
                                <LinkIcon className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <h5>{link.title}</h5>
                                <p className="text-gray-500 mt-0.5">
                                  Added 2 days ago by {link.created_by_detail.email}
                                </p>
                              </div>
                            </a>
                          </Link>
                        </div>
                      ))
                    : null}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full w-full flex justify-center items-center">
            <Spinner />
          </div>
        )}
      </div>
    </>
  );
};

export default ModuleDetailSidebar;
