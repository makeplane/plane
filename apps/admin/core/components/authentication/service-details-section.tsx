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

// components
import type { TCopyField } from "@/components/common/copy-field";
import { CopyField } from "@/components/common/copy-field";

type Props = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  fields: TCopyField[];
};

export function ServiceDetailsSection(props: Props) {
  const { icon: Icon, title, fields } = props;
  return (
    <div className="flex flex-col rounded-lg overflow-hidden">
      <div className="px-6 py-3 bg-layer-3 font-medium text-11 uppercase flex items-center gap-x-2 text-secondary">
        <Icon className="size-3.5" />
        {title}
      </div>
      <div className="px-6 py-4 flex flex-col gap-y-4 bg-layer-1">
        {fields.map((field) => (
          <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
        ))}
      </div>
    </div>
  );
}
