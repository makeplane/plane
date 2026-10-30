/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import React from "react";
// components
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { usePlatformOS } from "@/hooks/use-platform-os";
type Props = {
  labelDetails: any[];
  maxRender?: number;
};

export function ViewIssueLabel({ labelDetails, maxRender = 1 }: Props) {
  const { t } = useTranslation();

  const { isMobile } = usePlatformOS();
  return (
    <>
      {labelDetails?.length > 0 ? (
        labelDetails.length <= maxRender ? (
          <>
            {labelDetails.map((label) => (
              <div
                key={label.id}
                className="shadow-sm flex flex-shrink-0 cursor-default items-center rounded-md border border-strong px-2.5 py-1 text-11"
              >
                <Tooltip
                  label={t("web_ui.dynamic_label_value0_e34498", { value0: label.name })}
                  layout="stacked"
                  disabled={isMobile}
                >
                  <div className="flex items-center gap-1.5 text-secondary">
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{
                        backgroundColor: label?.color ?? "#000000",
                      }}
                    />
                    {label.name}
                  </div>
                </Tooltip>
              </div>
            ))}
          </>
        ) : (
          <div className="shadow-sm flex flex-shrink-0 cursor-default items-center rounded-md border border-strong px-2.5 py-1 text-11">
            <Tooltip
              label={t("web_ui.dynamic_labels_value0", { value0: labelDetails.map((l) => l.name).join(", ") })}
              layout="stacked"
              disabled={isMobile}
            >
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-accent-primary" />
                {t("web_ui.dynamic_value0_labels_292e1a", { value0: labelDetails.length })}
              </div>
            </Tooltip>
          </div>
        )
      ) : (
        ""
      )}
    </>
  );
}
