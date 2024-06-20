"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
// types
import { IUser, IImporterService } from "@plane/types";
// ui
import { Button, CustomSearchSelect, TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// services
import { ProjectExportService } from "@/services/project";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data: IImporterService | null;
  user: IUser | null;
  provider: string | string[];
  mutateServices: () => void;
};

const projectExportService = new ProjectExportService();

export const Exporter: React.FC<Props> = observer((props) => {
  const { isOpen, handleClose, user, provider, mutateServices } = props;
  // states
  const [exportLoading, setExportLoading] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { workspaceProjectIds, getProjectById } = useProject();

  const options = workspaceProjectIds?.map((projectId) => {
    const projectDetails = getProjectById(projectId);

    return {
      value: projectDetails?.id,
      query: `${projectDetails?.name} ${projectDetails?.identifier}`,
      content: (
        <div className="flex items-center gap-2">
          <span className="text-[0.65rem] text-custom-text-200">{projectDetails?.identifier}</span>
          {projectDetails?.name}
        </div>
      ),
    };
  });

  const [value, setValue] = React.useState<string[]>([]);
  const [multiple, setMultiple] = React.useState<boolean>(false);
  const onChange = (val: any) => {
    setValue(val);
  };
  const ExportCSVToMail = async () => {
    setExportLoading(true);
    if (workspaceSlug && user && typeof provider === "string") {
      const payload = {
        provider: provider,
        project: value,
        multiple: multiple,
      };
      await projectExportService
        .csvExport(workspaceSlug as string, payload)
        .then(() => {
          mutateServices();
          router.push(`/${workspaceSlug}/settings/exports`);
          setExportLoading(false);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Export Successful",
            message: `You will be able to download the exported ${
              provider === "csv" ? "CSV" : provider === "xlsx" ? "Excel" : provider === "json" ? "JSON" : ""
            } from the previous export.`,
          });
        })
        .catch(() => {
          setExportLoading(false);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Export was unsuccessful. Please try again.",
          });
        });
    }
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="relative z-20"
        onClose={() => {
          if (!isSelectOpen) handleClose();
        }}
      >
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="flex flex-col gap-6 gap-y-4 p-6">
                  <div className="flex w-full items-center justify-start gap-6">
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">
                        Export to{" "}
                        {provider === "csv" ? "CSV" : provider === "xlsx" ? "Excel" : provider === "json" ? "JSON" : ""}
                      </h3>
                    </span>
                  </div>
                  <div>
                    <CustomSearchSelect
                      value={value ?? []}
                      onChange={(val: string[]) => onChange(val)}
                      options={options}
                      input
                      label={
                        value && value.length > 0
                          ? value
                              .map((projectId) => {
                                const projectDetails = getProjectById(projectId);

                                return projectDetails?.identifier;
                              })
                              .join(", ")
                          : "All projects"
                      }
                      onOpen={() => setIsSelectOpen(true)}
                      onClose={() => setIsSelectOpen(false)}
                      optionsClassName="min-w-full"
                      multiple
                    />
                  </div>
                  <div
                    onClick={() => setMultiple(!multiple)}
                    className="flex max-w-min cursor-pointer items-center gap-2"
                  >
                    <input type="checkbox" checked={multiple} onChange={() => setMultiple(!multiple)} />
                    <div className="whitespace-nowrap text-sm">Export the data into separate files</div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={ExportCSVToMail}
                      disabled={exportLoading}
                      loading={exportLoading}
                    >
                      {exportLoading ? "Exporting..." : "Export"}
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
