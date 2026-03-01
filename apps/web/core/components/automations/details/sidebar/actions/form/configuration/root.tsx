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
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { EActionNodeHandlerName } from "@plane/types";
// local imports
import { AutomationActionAddCommentConfiguration } from "./add_comment/root";
import { AutomationActionChangePropertyConfiguration } from "./change-property/root";
import { AutomationActionRunScriptConfiguration } from "./run-script/root";

type TProps = {
  automationId: string;
  editorRef: React.RefObject<EditorRefApi>;
  isDisabled?: boolean;
  projectId: string;
  selectedHandlerName: EActionNodeHandlerName;
  workspaceId: string;
  workspaceSlug: string;
};

export function AutomationActionConfigurationRoot(props: TProps) {
  const { automationId, editorRef, isDisabled, selectedHandlerName, projectId, workspaceId, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();

  return (
    <div className="space-y-2.5">
      <p className="text-tertiary text-11 font-medium">{t("automations.action.configuration.label")}</p>
      {selectedHandlerName === EActionNodeHandlerName.ADD_COMMENT && (
        <AutomationActionAddCommentConfiguration
          automationId={automationId}
          editorRef={editorRef}
          isDisabled={isDisabled}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
        />
      )}
      {selectedHandlerName === EActionNodeHandlerName.CHANGE_PROPERTY && (
        <AutomationActionChangePropertyConfiguration isDisabled={isDisabled} projectId={projectId} />
      )}
      {selectedHandlerName === EActionNodeHandlerName.RUN_SCRIPT && (
        <AutomationActionRunScriptConfiguration workspaceSlug={workspaceSlug} />
      )}
    </div>
  );
}
