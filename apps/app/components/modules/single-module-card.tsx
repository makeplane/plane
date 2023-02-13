import React, { useState } from "react";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

// components
import { DeleteModuleModal } from "components/modules";
// ui
import { AssigneesList, Avatar } from "components/ui";
// icons
import { CalendarDaysIcon, TrashIcon } from "@heroicons/react/24/outline";
// helpers
import { renderShortNumericDateFormat } from "helpers/date-time.helper";
// types
import { IModule, SelectModuleType } from "types";
// common
import { MODULE_STATUS } from "constants/module";

type Props = {
  module: IModule;
};

export const SingleModuleCard: React.FC<Props> = ({ module }) => {
  const [moduleDeleteModal, setModuleDeleteModal] = useState(false);
  const [selectedModuleForDelete, setSelectedModuleForDelete] = useState<SelectModuleType>();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const handleDeleteModule = () => {
    if (!module) return;

    setSelectedModuleForDelete({ ...module, actionType: "delete" });
    setModuleDeleteModal(true);
  };

  return (
    <>
      <DeleteModuleModal
        isOpen={
          moduleDeleteModal &&
          !!selectedModuleForDelete &&
          selectedModuleForDelete.actionType === "delete"
        }
        setIsOpen={setModuleDeleteModal}
        data={selectedModuleForDelete}
      />
      <div className="group/card h-full w-full relative select-none p-2">
        <div className="absolute top-4 right-4 z-50 bg-red-200 opacity-0 group-hover/card:opacity-100">
          <button
            type="button"
            className="grid h-7 w-7 place-items-center  bg-white p-1 text-red-500 outline-none duration-300 hover:bg-red-50"
            onClick={() => handleDeleteModule()}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
        <Link href={`/${workspaceSlug}/projects/${module.project}/modules/${module.id}`}>
          <a className="flex flex-col cursor-pointer rounded-md border bg-white p-3 ">
            <span className="w-3/4 text-ellipsis overflow-hidden">{module.name}</span>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <div className="space-y-2">
                <h6 className="text-gray-500">LEAD</h6>
                <div>
                  <Avatar user={module.lead_detail} />
                </div>
              </div>
              <div className="space-y-2">
                <h6 className="text-gray-500">MEMBERS</h6>
                <div className="flex items-center gap-1 text-xs">
                  <AssigneesList users={module.members_detail} />
                </div>
              </div>
              <div className="space-y-2">
                <h6 className="text-gray-500">END DATE</h6>
                <div className="flex w-min cursor-pointer items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-xs shadow-sm">
                  <CalendarDaysIcon className="h-3 w-3" />
                  {renderShortNumericDateFormat(module.target_date ?? "")}
                </div>
              </div>
              <div className="space-y-2">
                <h6 className="text-gray-500">STATUS</h6>
                <div className="flex items-center gap-2 capitalize">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: MODULE_STATUS.find((s) => s.value === module.status)?.color,
                    }}
                  />
                  {module.status}
                </div>
              </div>
            </div>
          </a>
        </Link>
      </div>
    </>
  );
};
