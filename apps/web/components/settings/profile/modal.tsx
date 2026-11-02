/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { CloseOutline } from "@makeplane/propel/icons";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import { Dialog, DialogClose, DialogCloseGroup, DialogContent, DialogTitle } from "@makeplane/propel/components/dialog";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { SelectField } from "@makeplane/propel/components/select-field";
import { GROUPED_PROFILE_SETTINGS, PROFILE_SETTINGS_CATEGORIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// local imports
import { ProfileSettingsContent } from "./content";
import { ProfileSettingsSidebarRoot } from "./sidebar";
import { ProfileSettingsSidebarWorkspaceOptions } from "./sidebar/workspace-options";

export const ProfileSettingsModal = observer(function ProfileSettingsModal() {
  // plane hooks
  const { t } = useTranslation();
  const { profileTabId } = useParams();
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
            variant="ghost"
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
        <div className="@container flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="border-b border-subtle px-4 pt-10 pb-3 md:hidden">
            <SelectField
              size="lg"
              width="fit"
              aria-label={t("profile_settings")}
              value={activeTab}
              onValueChange={(tab) => {
                if (tab !== null) toggleProfileSettingsModal({ activeTab: tab });
              }}
              options={PROFILE_SETTINGS_CATEGORIES.flatMap((category) => GROUPED_PROFILE_SETTINGS[category]).map(
                (tab) => ({
                  value: tab.key,
                  label: t(tab.i18n_label),
                })
              )}
            />
            {profileTabId && (
              <div className="vertical-scrollbar mt-3 scrollbar-sm max-h-36 overflow-y-auto">
                <ProfileSettingsSidebarWorkspaceOptions />
              </div>
            )}
          </div>
          <ProfileSettingsSidebarRoot
            activeTab={activeTab}
            className="hidden w-70 rounded-l-xl md:flex"
            updateActiveTab={(tab) => toggleProfileSettingsModal({ activeTab: tab })}
          />
          <ProfileSettingsContent
            activeTab={activeTab}
            className="min-h-0 min-w-0 flex-1 rounded-b-xl md:rounded-r-xl"
            contentClassName="p-4 sm:p-8"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
});
