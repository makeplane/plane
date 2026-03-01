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

type TNumberedInstructions = {
  label: string;
  instructions: React.ReactNode[];
};

export function NumberedInstructions({ label, instructions }: TNumberedInstructions) {
  return (
    <div className="space-y-2 px-4 py-3 bg-layer-1 rounded-lg border border-subtle-1">
      <div className="text-body-sm-medium text-primary">{label}</div>
      {instructions.map((instruction, index) => (
        <div key={index} className="flex gap-2 text-body-sm-regular text-primary">
          <span className="shrink-0">{index + 1}.</span>
          <p>{instruction}</p>
        </div>
      ))}
    </div>
  );
}
