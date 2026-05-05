/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import type { IWorkSchedule } from "@plane/types";
import { WorkweekToggle } from "./workweek-toggle";

type Props = {
  open: boolean;
  onClose: () => void;
  schedule: IWorkSchedule;
};

export const WorkweekEditModal = ({ open, onClose, schedule }: Props) => (
  <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()} modal>
    <Dialog.Panel width={EDialogWidth.MD}>
      <div className="p-6">
        <Dialog.Title>Working week</Dialog.Title>
        <div className="mt-4">
          <WorkweekToggle schedule={schedule} />
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Dialog.Panel>
  </Dialog>
);
