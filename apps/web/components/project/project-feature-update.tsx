/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { useTranslation } from "@plane/i18n";
// ui
import { Button } from "@makeplane/propel/components/button";
import { DialogActions, DialogBody, DialogInfo, DialogMain } from "@makeplane/propel/components/dialog";
import { Logo } from "@plane/blocks/emoji-icon-picker";
// components
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { ProjectFeaturesList } from "@/components/project/settings/features-list";

type Props = {
  workspaceSlug: string;
  projectId: string | null;
  onClose: () => void;
};

export const ProjectFeatureUpdate = observer(function ProjectFeatureUpdate(props: Props) {
  const { workspaceSlug, projectId, onClose } = props;
  // store hooks
  const { t } = useTranslation();
  const { getProjectById } = useProject();

  if (!workspaceSlug || !projectId) return null;
  const currentProjectDetails = getProjectById(projectId);
  if (!currentProjectDetails) return null;

  return (
    <>
      <DialogMain>
        <DialogBody tabIndex={0}>
          <ProjectFeaturesList workspaceSlug={workspaceSlug} projectId={projectId} isAdmin />
        </DialogBody>
      </DialogMain>
      <DialogActions>
        <DialogInfo>
          <div className="flex gap-1 text-13 font-medium text-tertiary">
            {t("congrats")}
            <Logo logo={currentProjectDetails.logo_props} /> <p className="break-all">{currentProjectDetails.name}</p>{" "}
            {t("created").toLowerCase()}.
          </div>
        </DialogInfo>
        <Button variant="secondary" size="md" stretch="auto" onClick={onClose} label={t("close")} />
        <Button
          variant="primary"
          size="md"
          stretch="auto"
          nativeButton={false}
          render={<Link href={`/${workspaceSlug}/projects/${projectId}/issues`} onClick={onClose} />}
          label={t("open_project")}
        />
      </DialogActions>
    </>
  );
});
