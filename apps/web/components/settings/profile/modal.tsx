/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { CloseOutline } from "@makeplane/propel/icons";
import { observer } from "mobx-react";
// plane imports
import { Dialog, DialogClose, DialogCloseGroup, DialogContent, DialogTitle } from "@makeplane/propel/components/dialog";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { useTranslation } from "@plane/i18n";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// local imports
import { ProfileSettingsContent } from "./content";
import { ProfileSettingsSidebarRoot } from "./sidebar";

export const ProfileSettingsModal = observer(function ProfileSettingsModal() {
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { profileSettingsModal, toggleProfileSettingsModal } = useCommandPalette();
  // derived values
  const activeTab = profileSettingsModal.activeTab ?? "general";

  const handleClose = useCallback(() => {
    toggleProfileSettingsModal({
      isOpen: false,
    });
    setTimeout(() => {
      toggleProfileSettingsModal({
        activeTab: null,
      });
    }, 300);
  }, [toggleProfileSettingsModal]);

  return (
    <Dialog
      open={profileSettingsModal.isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="xl" height="fixed">
        <DialogCloseGroup>
          <IconButton
            size="sm"
            variant="tertiary"
            icon={<Icon icon={CloseOutline} />}
            aria-label={t("close")}
            render={<DialogClose />}
          />
        </DialogCloseGroup>
        {/* The settings sidebar is the visible chrome, so the dialog's accessible name is carried
            by a visually hidden title. */}
        <div className="sr-only">
          <DialogTitle>{t("profile_settings")}</DialogTitle>
        </div>
        {/* A plain two-column row rather than `DialogPanes`/`DialogAside`/`DialogMain`: the sidebar and
            content roots carry their own gutters and scroll areas, which the pane slots would pad again. */}
        <div className="@container flex min-h-0 flex-1">
          <ProfileSettingsSidebarRoot
            activeTab={activeTab}
            className="w-[250px] rounded-l-xl"
            updateActiveTab={(tab) => toggleProfileSettingsModal({ activeTab: tab })}
          />
          <ProfileSettingsContent activeTab={activeTab} className="flex-1 rounded-r-xl" />
        </div>
      </DialogContent>
    </Dialog>
  );
});
