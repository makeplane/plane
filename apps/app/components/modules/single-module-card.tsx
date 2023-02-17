import React, { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// components
import { DeleteModuleModal } from "components/modules";
// ui
import { AssigneesList, Avatar, CustomMenu } from "components/ui";
// icons
import { CalendarDaysIcon, TrashIcon } from "@heroicons/react/24/outline";
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
};

export const SingleModuleCard: React.FC<Props> = ({ module }) => {
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
    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/modules/${module.id}`)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Module link copied to clipboard",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Some error occurred",
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
            <CustomMenu.MenuItem onClick={handleCopyText}>Copy module link</CustomMenu.MenuItem>
            <CustomMenu.MenuItem onClick={handleDeleteModule}>
              Delete module permanently
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
        <Link href={`/${workspaceSlug}/projects/${module.project}/modules/${module.id}`}>
          <a className="flex flex-col justify-between h-full cursor-pointer rounded-md border bg-white p-3 ">
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
                  {module.target_date
                    ? renderShortNumericDateFormat(module?.target_date)
                    : "Invalid"}
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
