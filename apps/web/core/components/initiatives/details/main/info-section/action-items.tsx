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

import { observer } from "mobx-react";
import { Paperclip } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// plane imports
import { EpicIcon, ProjectIcon, LinkIcon } from "@plane/propel/icons";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { InitiativeActionButton } from "./action-button";
import { InitiativeAttachmentActionButton } from "./attachment-button";
import { InitiativeLinksActionButton } from "./link-button";
import { InitiativeReactions } from "./reactions";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  permissions: {
    canReact: boolean;
    canAddLink: boolean;
    canAddAttachment: boolean;
    canAddProject: boolean;
    canAddEpic: boolean;
  };
};

export const InitiativeInfoActionItems = observer(function InitiativeInfoActionItems(props: Props) {
  const { workspaceSlug, initiativeId, permissions } = props;
  // store hooks
  const {
    initiative: { toggleProjectsModal, toggleEpicModal },
  } = useInitiatives();
  // translation
  const { t } = useTranslation();

  return (
    <div className="flex gap-4 flex-col">
      <InitiativeReactions workspaceSlug={workspaceSlug} initiativeId={initiativeId} canReact={permissions.canReact} />
      <div className="flex items-center gap-2">
        <InitiativeLinksActionButton
          customButton={
            <div className="flex items-center gap-1 p-2 text-secondary hover:text-primary border border-subtle rounded">
              <LinkIcon className="size-3 shrink-0 text-tertiary" strokeWidth={2} />
              <span className="text-13 font-medium">{t("add_link")}</span>
            </div>
          }
          canAddLink={permissions.canAddLink}
        />
        <InitiativeAttachmentActionButton
          workspaceSlug={workspaceSlug.toString()}
          initiativeId={initiativeId}
          customButton={
            <div className="flex items-center gap-1 p-2 text-secondary hover:text-primary border border-subtle rounded">
              <Paperclip className="size-3 shrink-0 text-tertiary" strokeWidth={2} />
              <span className="text-13 font-medium">{t("common.attach")}</span>
            </div>
          }
          canAddAttachment={permissions.canAddAttachment}
        />
        <InitiativeActionButton
          customButton={
            <div className="flex items-center gap-1 p-2 text-secondary hover:text-primary border border-subtle rounded">
              <ProjectIcon className="size-3 shrink-0 text-tertiary" />
              <span className="text-13 font-medium">{t("add_project")}</span>
            </div>
          }
          disabled={!permissions.canAddProject}
          onClick={() => toggleProjectsModal(true)}
        />
        <InitiativeActionButton
          customButton={
            <div className="flex items-center gap-1 p-2 text-secondary hover:text-primary border border-subtle rounded">
              <EpicIcon className="size-3 shrink-0 text-tertiary" />
              <span className="text-13 font-medium">{t("epic.add.label")}</span>
            </div>
          }
          disabled={!permissions.canAddEpic}
          onClick={() => void toggleEpicModal(true, { workspaceSlug, initiativeId })}
        />
      </div>
    </div>
  );
});
