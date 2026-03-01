/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { EditIcon, TrashIcon } from "@plane/propel/icons";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
import { ProjectUpdateDeleteModal } from "./delete-update-modal";

type TProps = {
  updateId: string;
  operations: {
    update: () => void;
    remove: (updateId: string) => Promise<void>;
  };
};
export function UpdateQuickActions(props: TProps) {
  const { operations, updateId } = props;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMenuActive, setIsMenuActive] = useState(false);
  const actionSectionRef = useRef(null);
  return (
    <>
      <ProjectUpdateDeleteModal
        updateId={updateId}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        updateOperations={operations}
      />
      <CustomMenu
        customButton={
          <span
            ref={actionSectionRef}
            className="grid place-items-center p-0.5 text-placeholder hover:bg-layer-1 rounded-sm my-auto"
            onClick={() => {
              setIsMenuActive(!isMenuActive);
            }}
          >
            <MoreHorizontal className="size-4" />
          </span>
        }
        className={cn("h-full flex items-center opacity-100 z-20 flex-shrink-0 pointer-events-auto my-auto")}
        customButtonClassName="grid place-items-center"
        placement="bottom-start"
      >
        <CustomMenu.MenuItem onClick={() => operations.update()}>
          <button className="flex items-center justify-start gap-2">
            <EditIcon className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Edit</span>
          </button>
        </CustomMenu.MenuItem>

        <CustomMenu.MenuItem onClick={() => setIsDeleteModalOpen(true)}>
          <button className="flex items-center justify-start gap-2">
            <TrashIcon className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Delete</span>
          </button>
        </CustomMenu.MenuItem>
      </CustomMenu>
    </>
  );
}
