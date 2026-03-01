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
import { useTranslation } from "@plane/i18n";
import type { ETemplateType } from "@plane/types";
import { Loader } from "@plane/ui";
import { getTemplateI18nLabel } from "@plane/utils";

type TemplateListWrapperProps = {
  type: ETemplateType;
  isInitializing: boolean;
  templateIds: string[];
  children: React.ReactNode;
};

export const TemplateListWrapper = observer(function TemplateListWrapper(props: TemplateListWrapperProps) {
  const { type, isInitializing, templateIds, children } = props;
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const areTemplatesAvailable = templateIds.length > 0;

  if (!isInitializing && !areTemplatesAvailable) return null;
  return (
    <div className="flex flex-col gap-4 w-full">
      <h3 className="text-body-xs-semibold text-placeholder">{t(getTemplateI18nLabel(type))}</h3>
      <div className="flex flex-col gap-4">
        {isInitializing ? (
          <Loader className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Loader.Item key={index} height="70px" />
            ))}
          </Loader>
        ) : (
          children
        )}
      </div>
    </div>
  );
});
