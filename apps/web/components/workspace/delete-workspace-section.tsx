/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import type { IWorkspace } from "@plane/types";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// local imports
import { DeleteWorkspaceModal } from "./delete-workspace-modal";

type TDeleteWorkspace = {
  workspace: IWorkspace | null;
};

export const DeleteWorkspaceSection = observer(function DeleteWorkspaceSection(props: TDeleteWorkspace) {
  const { workspace } = props;
  // states
  const [deleteWorkspaceModal, setDeleteWorkspaceModal] = useState(false);
  // translation
  const { t } = useTranslation();

  return (
    <>
      <DeleteWorkspaceModal
        data={workspace}
        isOpen={deleteWorkspaceModal}
        onClose={() => setDeleteWorkspaceModal(false)}
      />
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.general.delete_workspace")}
        description={t("workspace_settings.settings.general.delete_workspace_description")}
        control={
          <Button
            variant="danger-outline"
            size="sm"
            stretch="auto"
            label={t("delete")}
            onClick={() => setDeleteWorkspaceModal(true)}
          />
        }
      />
    </>
  );
});
