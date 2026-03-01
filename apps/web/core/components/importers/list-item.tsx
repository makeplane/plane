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
import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/propel/button";
import { cn } from "@plane/utils";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";
// local imports
import { BetaBadge } from "@/components/common/beta";
import type { ImporterProps } from "./list";

type Props = {
  provider: ImporterProps;
  workspaceSlug: string;
};

export const ImportersListItem = observer(function ImportersListItem(props: Props) {
  const { provider, workspaceSlug } = props;
  // translation
  const { t } = useTranslation();
  // derived values
  const isFeatureEnabled = useFlag(workspaceSlug, provider.flag);
  const importerUnderFlags = ["notion", "confluence", "csv-import"];

  if (!isFeatureEnabled && importerUnderFlags.includes(provider.key)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-md bg-layer-2 border border-subtle-1 p-4">
      <div className="shrink-0 size-10 bg-layer-3 rounded-lg grid place-items-center">
        <img src={provider.logo} alt={`${provider.title} Logo`} className="size-6" />
      </div>
      <div className="flex flex-col gap-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-body-sm-medium">{provider.title}</h3>
          {provider.beta && (
            <span className="shrink-0">
              <BetaBadge />
            </span>
          )}
        </div>
        <p className="text-13 tracking-tight text-secondary truncate">{t(provider.i18n_description)}</p>
      </div>
      <Link
        href={`/${workspaceSlug}/settings/imports/${provider.key}`}
        className={cn("shrink-0 self-start", getButtonStyling("secondary", "base"))}
      >
        {t("importers.import")}
      </Link>
    </div>
  );
});
