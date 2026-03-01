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
import Link from "next/link";
import { useTranslation } from "@plane/i18n";
// ui
import { Button, getButtonStyling } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { Row } from "@plane/ui";
// components
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { ProjectFeaturesList } from "@/components/projects/create/features/list";

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
      <Row className="py-6">
        <ProjectFeaturesList workspaceSlug={workspaceSlug} projectId={projectId} isAdmin isCreateModal />
      </Row>
      <div className="flex items-center justify-between gap-2 mt-4 px-6 py-4 border-t border-subtle">
        <div className="flex gap-1 text-13 text-tertiary font-medium">
          {t("congrats")}
          <Logo logo={currentProjectDetails.logo_props} /> <p className="break-all">{currentProjectDetails.name}</p>{" "}
          {t("created").toLowerCase()}.
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="lg" onClick={onClose} tabIndex={1}>
            {t("close")}
          </Button>
          <Link
            href={`/${workspaceSlug}/projects/${projectId}/issues`}
            onClick={onClose}
            className={getButtonStyling("primary", "lg")}
            tabIndex={2}
          >
            {t("open_project")}
          </Link>
        </div>
      </div>
    </>
  );
});
