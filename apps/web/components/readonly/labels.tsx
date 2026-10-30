/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { cn } from "@plane/utils";
// hooks
import { useLabel } from "@/hooks/store/use-label";
import { usePlatformOS } from "@/hooks/use-platform-os";

export type TReadonlyLabelsProps = {
  className?: string;
  hideIcon?: boolean;
  value: string[];
  placeholder?: string;
  projectId: string | undefined;
  workspaceSlug: string;
};

export const ReadonlyLabels = observer(function ReadonlyLabels(props: TReadonlyLabelsProps) {
  const { t } = useTranslation();

  const { className, value, projectId, workspaceSlug } = props;

  const { getLabelById, fetchProjectLabels } = useLabel();
  const { isMobile } = usePlatformOS();
  const labels = value
    .map((labelId) => getLabelById(labelId))
    .filter((label): label is NonNullable<typeof label> => Boolean(label));

  useEffect(() => {
    if (projectId) {
      fetchProjectLabels(workspaceSlug?.toString(), projectId);
    }
  }, [projectId, workspaceSlug, fetchProjectLabels]);

  return (
    <div className={cn("flex items-center gap-2 text-body-xs-regular", className)}>
      {labels && (
        <>
          <Tooltip
            label={t("web_ui.dynamic_labels_value0", { value0: labels.map((l) => l?.name).join(", ") })}
            layout="stacked"
            disabled={labels.length === 0 || isMobile}
          >
            <div className="flex h-full items-center gap-1 rounded-sm py-1 text-body-xs-bold">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-accent-primary" />
              <span>{value.length}</span>
              <span>{t("labels")}</span>
            </div>
          </Tooltip>
        </>
      )}
    </div>
  );
});
