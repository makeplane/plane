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
import type { ETemplateLevel } from "@plane/constants";
// components
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
// local imports
import { CreateTemplatesButton } from "./create-button";

type TNoTemplatesEmptyStateProps = { workspaceSlug: string } & (
  | {
      currentLevel: ETemplateLevel.WORKSPACE;
    }
  | {
      currentLevel: ETemplateLevel.PROJECT;
      projectId: string;
    }
);

export const NoTemplatesEmptyState = observer(function NoTemplatesEmptyState(props: TNoTemplatesEmptyStateProps) {
  // derived values
  const { t } = useTranslation();

  return (
    <>
      <div className="w-full py-2">
        <div className="flex items-center justify-center h-full w-full">
          <EmptyStateCompact
            assetKey="template"
            title={t("settings_empty_state.templates.title")}
            description={t("settings_empty_state.templates.description")}
            customButton={
              <CreateTemplatesButton
                {...props}
                buttonSize="base"
                buttonI18nLabel="templates.empty_state.no_templates.button"
                variant="empty_state"
              />
            }
            align="start"
            rootClassName="py-20"
          />
        </div>
      </div>
    </>
  );
});
