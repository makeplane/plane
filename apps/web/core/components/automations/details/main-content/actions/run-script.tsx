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

import { FileCode } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web imports
import type { TRunScriptActionConfig } from "@plane/types";
import useSWR from "swr";
import { useRunners } from "@/plane-web/hooks/store";
import { observer } from "mobx-react";

type TProps = {
  actionId: string;
  config: TRunScriptActionConfig;
  workspaceId: string;
  workspaceSlug: string;
};

export const AutomationDetailsMainContentRunScriptBlock = observer(function AutomationDetailsMainContentRunScriptBlock(
  props: TProps
) {
  const { config, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  const { fetchScriptById, getScriptById } = useRunners();
  // derived values
  const script = getScriptById(config?.script_id);
  // swr
  useSWR(
    config?.script_id ? `RUNNER_SCRIPT_DETAIL_${workspaceSlug}_${config.script_id}` : null,
    config?.script_id ? () => fetchScriptById(workspaceSlug ?? "", config.script_id) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  return (
    <div className="flex gap-2">
      <span className="shrink-0 size-12 rounded-full bg-layer-1 grid place-items-center">
        <FileCode className="size-5 text-tertiary" />
      </span>
      <div className="flex-grow text-13 text-tertiary font-medium">
        <p>{t("automations.action.run_script_block.title")}</p>
        <p className="text-primary">{script?.name}</p>
      </div>
    </div>
  );
});
