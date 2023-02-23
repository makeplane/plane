import React, { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";

// components
import { DeleteModuleModal } from "components/modules";
// ui
import { AssigneesList, Avatar, CustomMenu } from "components/ui";
// icons
import User from "public/user.png";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
// helpers
import { renderShortNumericDateFormat } from "helpers/date-time.helper";
// types
import { IModule } from "types";
// common
import { MODULE_STATUS } from "constants/module";
import useToast from "hooks/use-toast";
import { copyTextToClipboard } from "helpers/string.helper";

type Props = {
  module: IModule;
  handleEditModule: () => void;
};

export const SingleModuleCard: React.FC<Props> = ({ module, handleEditModule }) => {
  const [moduleDeleteModal, setModuleDeleteModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  const { setToastAlert } = useToast();

  const handleDeleteModule = () => {
    if (!module) return;

    setModuleDeleteModal(true);
  };

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(
      `${originURL}/${workspaceSlug}/projects/${projectId}/modules/${module.id}`
    ).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Module link copied to clipboard.",
      });
    });
  };

  return (
    <>
      <DeleteModuleModal
        isOpen={moduleDeleteModal}
        setIsOpen={setModuleDeleteModal}
        data={module}
      />
      <div className="group/card h-full w-full relative select-none p-2">
        <div className="absolute top-4 right-4 ">
          <CustomMenu width="auto" ellipsis>
            <CustomMenu.MenuItem onClick={handleEditModule}>Edit module</CustomMenu.MenuItem>
            <CustomMenu.MenuItem onClick={handleDeleteModule}>Delete module</CustomMenu.MenuItem>
            <CustomMenu.MenuItem onClick={handleCopyText}>Copy module link</CustomMenu.MenuItem>
          </CustomMenu>
        </div>
        <Link href={`/${workspaceSlug}/projects/${module.project}/modules/${module.id}`}>
          <a className="flex flex-col justify-between h-full cursor-default rounded-md border bg-white p-3 ">
            <span className="w-3/4 text-ellipsis cursor-pointer overflow-hidden">
              {module.name}
            </span>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <div className="space-y-2 ">
                <h6 className="text-gray-500">LEAD</h6>
                <div>
                  {module.lead_detail ? (
                    <Avatar user={module.lead_detail} />
                  ) : (
                    <div className="flex items-center gap-1">
                      <Image
                        src={User}
                        height="16px"
                        width="16px"
                        className="rounded-full"
                        alt="N/A"
                      />
                      <span>N/A</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h6 className="text-gray-500">MEMBERS</h6>
                <div className="flex  items-center gap-1 text-xs">
                  {module.members_detail && module.members_detail.length > 0 ? (
                    <AssigneesList users={module.members_detail} length={3} />
                  ) : (
                    <div className="flex items-center gap-1">
                      <Image
                        src={User}
                        height="16px"
                        width="16px"
                        className="rounded-full"
                        alt="N/A"
                      />
                      <span>N/A</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h6 className="text-gray-500">END DATE</h6>
                <div className="flex w-min items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-xs shadow-sm">
                  <CalendarDaysIcon className="h-3 w-3" />
                  {module.target_date ? renderShortNumericDateFormat(module?.target_date) : "N/A"}
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
