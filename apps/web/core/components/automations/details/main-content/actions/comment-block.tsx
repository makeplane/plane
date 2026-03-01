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
import { MessageCircle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web imports
import type { TAddCommentActionConfig } from "@plane/types";
import { LiteTextEditor } from "@/components/editor/lite-text/editor";

type TProps = {
  actionId: string;
  config: TAddCommentActionConfig;
  workspaceId: string;
  workspaceSlug: string;
};

export const AutomationDetailsMainContentAddCommentBlock = observer(
  function AutomationDetailsMainContentAddCommentBlock(props: TProps) {
    const { actionId, config, workspaceId, workspaceSlug } = props;
    // plane hooks
    const { t } = useTranslation();

    return (
      <div className="flex gap-2">
        <span className="shrink-0 size-12 rounded-full bg-layer-1 grid place-items-center">
          <MessageCircle className="size-5 text-tertiary" />
        </span>
        <div className="flex-grow text-13 text-tertiary font-medium">
          <p>{t("automations.action.comment_block.title")}</p>
          <LiteTextEditor
            editable={false}
            disabledExtensions={["enter-key"]}
            displayConfig={{
              fontSize: "small-font",
            }}
            id={actionId}
            initialValue={config.comment_text ?? "<p></p>"}
            parentClassName="p-0"
            showSubmitButton={false}
            variant="none"
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
          />
        </div>
      </div>
    );
  }
);
