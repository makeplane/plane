/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { Dialog, DialogContent } from "@makeplane/propel/components/dialog";
import { useTranslation } from "@plane/i18n";
import { Stickies } from "./stickies";

type TProps = {
  isOpen: boolean;
  handleClose: () => void;
};
export function AllStickiesModal(props: TProps) {
  const { isOpen, handleClose } = props;
  // plane hooks
  const { t } = useTranslation();
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      {/* the visible "Your stickies" heading lives inside `Stickies` as plain text, so name the popup here */}
      <DialogContent size="xl" aria-label={t("stickies.title")}>
        <Stickies handleClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
}
