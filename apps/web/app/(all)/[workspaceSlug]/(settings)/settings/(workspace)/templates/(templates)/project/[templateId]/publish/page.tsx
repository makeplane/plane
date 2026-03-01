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
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
// plane web imports
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { TemplatesUpgrade } from "@/components/templates/settings";
import { PublishTemplate } from "@/components/templates/settings/publish";
import { useProjectTemplates } from "@/plane-web/hooks/store";
import type { Route } from "./+types/page";

function PublishProjectTemplatePage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, templateId } = params;
  // store hooks
  const { isInitializingTemplates, getTemplateById } = useProjectTemplates();
  // derived values
  const templateInstance = getTemplateById(templateId);

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug}
      flag={E_FEATURE_FLAGS.PROJECT_TEMPLATES_PUBLISH}
      fallback={<TemplatesUpgrade flag={E_FEATURE_FLAGS.PROJECT_TEMPLATES_PUBLISH} />}
    >
      <PublishTemplate
        workspaceSlug={workspaceSlug}
        templateInstance={templateInstance}
        isInitializing={isInitializingTemplates}
      />
    </WithFeatureFlagHOC>
  );
}

export default observer(PublishProjectTemplatePage);
