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
import { useTranslation } from "@plane/i18n";
import { Input } from "@plane/ui";

type Props = {
  onChange: (value: string) => void;
  value: string | undefined;
};

export function WidgetConfigSidebarTitle(props: Props) {
  const { onChange, value } = props;
  // translation
  const { t } = useTranslation();

  return (
    <div className="flex-shrink-0 flex flex-col gap-2">
      <label htmlFor="widget-title" className="text-13 font-medium text-secondary">
        {t("dashboards.widget.common.widget_title.label")}
      </label>
      <Input
        id="widget-title"
        type="text"
        className="w-full"
        placeholder={t("dashboards.widget.common.widget_title.placeholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={255}
        required
      />
    </div>
  );
}
