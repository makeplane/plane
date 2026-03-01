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
import { useSearchParams } from "next/navigation";
// plane web imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { IssueModalProvider } from "@/components/issues/issue-modal/context/provider";
import { TemplatesUpgrade } from "@/components/templates/settings";
import { CreateUpdateProjectTemplate } from "@/components/templates/settings/project";
import type { Route } from "./+types/page";

function CreateProjectTemplatePage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  const searchParams = useSearchParams();
  // store hooks
  const { t } = useTranslation();
  // derived values
  const templateId = searchParams.get("templateId");

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug}
      flag={E_FEATURE_FLAGS.PROJECT_TEMPLATES}
      fallback={<TemplatesUpgrade flag={E_FEATURE_FLAGS.PROJECT_TEMPLATES} />}
    >
      <div className="flex items-center justify-between border-b border-subtle-1 pb-3 tracking-tight w-full">
        <div>
          <h3 className="text-18 font-medium">{t("templates.settings.new_project_template")}</h3>
        </div>
      </div>
      <IssueModalProvider>
        <CreateUpdateProjectTemplate workspaceSlug={workspaceSlug} templateId={templateId ?? undefined} />
      </IssueModalProvider>
    </WithFeatureFlagHOC>
  );
}

export default observer(CreateProjectTemplatePage);
