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

import { TriangleAlert } from "lucide-react";
import { RadioInput } from "@/components/estimates/radio-select";

type TSelectCommentSyncDirection = {
  value: boolean;
  onChange: (value: boolean) => void;
};

const options = [
  {
    label: "Bidirectional — sync comments between Plane and Bitbucket PRs",
    value: "bidirectional",
  },
  {
    label: "Unidirectional — only sync from Bitbucket to Plane",
    value: "unidirectional",
  },
];

export function SelectCommentSyncDirection({ value, onChange }: TSelectCommentSyncDirection) {
  return (
    <div className="flex flex-col items-start gap-1.5 pt-2 mb-4">
      <div className="text-body-xs-regular text-secondary">Comment sync direction</div>
      <RadioInput
        selected={value ? "bidirectional" : "unidirectional"}
        options={options}
        onChange={(val) => onChange(val === "bidirectional")}
        className="z-10"
        buttonClassName="size-3"
        fieldClassName="text-body-xs-regular gap-1.5"
        wrapperClassName="gap-1.5"
        vertical
      />
      {!value && (
        <div className="flex gap-1">
          <TriangleAlert className="size-4 text-yellow-500" />
          <div className="text-body-xs-regular text-yellow-500">
            Comments created in Plane will not be synced to Bitbucket PRs.
          </div>
        </div>
      )}
    </div>
  );
}
