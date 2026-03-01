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
// plane imports
import { E_FEATURE_FLAGS, ETemplateLevel } from "@plane/constants";
// plane web imports
import { useTranslation } from "@plane/i18n";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { TemplatesUpgrade } from "@/components/templates/settings";
import { CreateUpdatePageTemplate } from "@/components/templates/settings/page";
import type { Route } from "./+types/page";
function CreateProjectLevelPageTemplatePage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  const searchParams = useSearchParams();
  // derived values
  const templateId = searchParams.get("templateId");
  const { t } = useTranslation();

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug}
      flag={E_FEATURE_FLAGS.PAGE_TEMPLATES}
      fallback={<TemplatesUpgrade flag={E_FEATURE_FLAGS.PAGE_TEMPLATES} />}
    >
      <div className="flex items-center justify-between border-b border-subtle-1 pb-3 tracking-tight w-full">
        <div>
          <h3 className="text-18 font-medium">{t("templates.settings.new_page_template")}</h3>
        </div>
      </div>
      <CreateUpdatePageTemplate
        workspaceSlug={workspaceSlug}
        currentLevel={ETemplateLevel.PROJECT}
        projectId={projectId}
        templateId={templateId ?? undefined}
      />
    </WithFeatureFlagHOC>
  );
}

export default observer(CreateProjectLevelPageTemplatePage);
