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

import { isEmpty } from "lodash-es";
import { Briefcase } from "lucide-react";
import { PiChatEditorWithRef } from "@plane/editor";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { Card } from "@plane/ui";
import type { TArtifact } from "@/types";
import { Properties } from "../preview-cards/properties";

type TProps = {
  data: TArtifact;
};

export function TemplateDetail(props: TProps) {
  const { data } = props;
  const properties = {
    ...data?.parameters?.properties,
    project: data?.parameters?.project,
    showContainer: true,
  };
  return (
    <Card className="relative max-w-[700px] rounded-xl shadow-overlay-200 space-y-0 border border-subtle overflow-hidden">
      <div className="p-3 flex flex-col gap-4 ">
        {/* icon */}
        {data.parameters?.logo_props && (
          <div className="flex flex-col gap-2">
            <div className="text-body-sm-medium text-secondary capitalize">{data.artifact_type} icon</div>
            <div className="flex h-8  w-8 items-center justify-center rounded-md bg-layer-1">
              <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                {data.parameters?.logo_props ? (
                  <Logo logo={data.parameters?.logo_props} size={16} />
                ) : (
                  <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                    <Briefcase className="h-4 w-4" />
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
        {/* title */}
        <div className="flex flex-col gap-2">
          <div className="text-body-sm-medium text-secondary capitalize">{data.artifact_type} title</div>
          <div className="border border-subtle-1 rounded-lg py-2 px-4 text-base font-medium">
            {data.parameters?.name || "Unknown"}
          </div>
        </div>
        {/* description */}
        {data.parameters?.description && (
          <div className="flex flex-col gap-2">
            <div className="text-body-sm-medium text-secondary">Description</div>
            <div className="border border-subtle-1 rounded-lg py-2 px-4 text-sm text-secondary">
              <PiChatEditorWithRef editable={false} content={data.parameters?.description} />
            </div>
          </div>
        )}
        {/* properties */}
        {!isEmpty(properties) && (
          <div className="flex flex-col">
            <div className="text-body-sm-medium text-secondary">Properties</div>
            <Properties {...properties} />
          </div>
        )}
      </div>
    </Card>
  );
}
