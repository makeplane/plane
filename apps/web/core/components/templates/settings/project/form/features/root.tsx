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
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TProjectTemplateForm } from "@plane/types";
import { Switch } from "@plane/propel/switch";
// plane web imports
import { TemplateCollapsibleWrapper } from "@/components/templates/settings/common";
import { PROJECT_FEATURES_LIST_FOR_TEMPLATE } from "@/constants/project/settings/features";
import type { TProjectFeatureForTemplateKeys } from "@/constants/project/settings/features";
// local imports
import { ProjectFeatureChildren } from "./children";

export const ProjectFeatures = observer(function ProjectFeatures() {
  // plane hooks
  const { t } = useTranslation();
  // form context
  const { control, watch } = useFormContext<TProjectTemplateForm>();

  return (
    <TemplateCollapsibleWrapper title={t("common.features")}>
      <div className="flex flex-col gap-y-4 pt-2 pb-4">
        {Object.entries(PROJECT_FEATURES_LIST_FOR_TEMPLATE).map(([featureKey, feature]) => (
          <div key={featureKey} className="gap-x-8 gap-y-2 border border-subtle bg-surface-1 px-4 py-3 rounded-lg">
            <div key={featureKey} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center bg-layer-1 p-2 rounded-lg">{feature.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-body-xs-medium leading-5">{t(feature.key)}</h4>
                  </div>
                  <p className="text-caption-sm-regular leading-4 text-tertiary">{t(`${feature.key}_description`)}</p>
                </div>
              </div>
              <Controller
                control={control}
                name={`project.${feature.property}` as keyof TProjectTemplateForm}
                render={({ field: { value, onChange } }) => (
                  <Switch value={Boolean(value)} onChange={() => onChange(!value)} />
                )}
              />
            </div>
            {watch(`project.${feature.property}` as keyof TProjectTemplateForm) && (
              <ProjectFeatureChildren feature={featureKey as TProjectFeatureForTemplateKeys} />
            )}
          </div>
        ))}
      </div>
    </TemplateCollapsibleWrapper>
  );
});
