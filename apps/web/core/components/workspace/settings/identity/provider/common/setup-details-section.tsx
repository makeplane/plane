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

// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// store hooks
import { useWorkspace } from "@/hooks/store/use-workspace";

type TProviderSetupDetailsSectionProps = {
  workspaceSlug: string;
  onOpenModal: () => void;
};

export function ProviderSetupDetailsSection(props: TProviderSetupDetailsSectionProps) {
  const { workspaceSlug, onOpenModal } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspace = getWorkspaceBySlug(workspaceSlug);
  const workspaceName = workspace?.name || "Workspace";

  return (
    <div className="w-full flex items-center justify-between gap-3 rounded-lg bg-layer-1-selected py-3 px-4">
      <h6 className="text-h6-medium text-primary">
        {t("sso.providers.setup_details_section.title", { workspaceName })}
      </h6>
      <Button variant="secondary" size="lg" onClick={onOpenModal}>
        {t("sso.providers.setup_details_section.button_text")}
      </Button>
    </div>
  );
}
