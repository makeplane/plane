/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane types
// plane ui
import { useTranslation } from "@plane/i18n";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { WidgetList } from "./widget-list";

export type TProps = {
  workspaceSlug: string;
  isModalOpen: boolean;
  handleOnClose?: () => void;
};

export const ManageWidgetsModal = observer(function ManageWidgetsModal(props: TProps) {
  // props
  const { workspaceSlug, isModalOpen, handleOnClose } = props;
  const { t } = useTranslation();

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open) handleOnClose?.();
      }}
    >
      <DialogContent size="xs">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>{t("home.manage_widgets")}</DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody tabIndex={0}>
            <WidgetList workspaceSlug={workspaceSlug} />
          </DialogBody>
        </DialogMain>
      </DialogContent>
    </Dialog>
  );
});
