/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
// plane imports
import { Button, getButtonStyling } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onDiscardHref: string;
};

export function ConfirmDiscardModal(props: Props) {
  const { isOpen, handleClose, onDiscardHref } = props;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()} modal>
      <Dialog.Panel width={EDialogWidth.SM}>
        <div className="p-6">
          <Dialog.Title>You have unsaved changes</Dialog.Title>
          <div className="mt-4">
            <p className="text-13 text-tertiary">
              Changes you made will be lost if you go back. Do you wish to go back?
            </p>
          </div>
          <div className="mt-6 flex justify-end items-center gap-2">
            <Button variant="secondary" size="lg" onClick={handleClose}>
              Keep editing
            </Button>
            <Link href={onDiscardHref} className={getButtonStyling("primary", "base")}>
              Go back
            </Link>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
