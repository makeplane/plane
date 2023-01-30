import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { CalendarDaysIcon, TrashIcon } from "@heroicons/react/24/outline";
import ConfirmModuleDeletion from "./confirm-module-deletion";
// icons
import User from "public/user.png";
// helpers
import { renderShortNumericDateFormat } from "helpers/date-time.helper";
// types
import { IModule, SelectModuleType } from "types";
// common
import { MODULE_STATUS } from "constants/";

type Props = {
  module: IModule;
};

const SingleModuleCard: React.FC<Props> = ({ module }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;
  const [moduleDeleteModal, setModuleDeleteModal] = useState(false);
  const [selectedModuleForDelete, setSelectedModuleForDelete] = useState<SelectModuleType>();
  const handleDeleteModule = () => {
    if (!module) return;

    setSelectedModuleForDelete({ ...module, actionType: "delete" });
    setModuleDeleteModal(true);
  };

  return (
    <div className="group/card relative select-none p-2">
      <div className="absolute top-4 right-4 z-50 bg-red-200 opacity-0 group-hover/card:opacity-100">
        <button
          type="button"
          className="grid h-7 w-7 place-items-center  bg-white p-1 text-red-500 outline-none duration-300 hover:bg-red-50"
          onClick={() => handleDeleteModule()}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
      <ConfirmModuleDeletion
        isOpen={
          moduleDeleteModal &&
          !!selectedModuleForDelete &&
          selectedModuleForDelete.actionType === "delete"
        }
        setIsOpen={setModuleDeleteModal}
        data={selectedModuleForDelete}
      />
      <Link href={`/${workspaceSlug}/projects/${module.project}/modules/${module.id}`}>
        <a className="block cursor-pointer rounded-md border bg-white p-3">
          {module.name}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
            <div className="space-y-2">
              <h6 className="text-gray-500">LEAD</h6>
              <div>
                {module.lead ? (
                  module.lead_detail?.avatar && module.lead_detail.avatar !== "" ? (
                    <div className="h-5 w-5 rounded-full border-2 border-white">
                      <Image
                        src={module.lead_detail.avatar}
                        height="100%"
                        width="100%"
                        className="rounded-full"
                        alt={module.lead_detail.first_name}
                      />
                    </div>
                  ) : (
                    <div className="grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-gray-700 capitalize text-white">
                      {module.lead_detail?.first_name && module.lead_detail.first_name !== ""
                        ? module.lead_detail.first_name.charAt(0)
                        : module.lead_detail?.email.charAt(0)}
                    </div>
                  )
                ) : (
                  "N/A"
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h6 className="text-gray-500">MEMBERS</h6>
              <div className="flex items-center gap-1 text-xs">
                {module.members && module.members.length > 0 ? (
                  module?.members_detail?.map((member, index: number) => (
                    <div
                      key={index}
                      className={`relative z-[1] h-5 w-5 rounded-full ${
                        index !== 0 ? "-ml-2.5" : ""
                      }`}
                    >
                      {member?.avatar && member.avatar !== "" ? (
                        <div className="h-5 w-5 rounded-full border-2 border-white bg-white">
                          <Image
                            src={member.avatar}
                            height="100%"
                            width="100%"
                            className="rounded-full"
                            alt={member?.first_name}
                          />
                        </div>
                      ) : (
                        <div className="grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-gray-700 capitalize text-white">
                          {member?.first_name && member.first_name !== ""
                            ? member.first_name.charAt(0)
                            : member?.email?.charAt(0)}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-white bg-white">
                    <Image
                      src={User}
                      height="100%"
                      width="100%"
                      className="rounded-full"
                      alt="No user"
                    />
                  </div>
                )}
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
  );
};

export default SingleModuleCard;
