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

import { PlusCircle } from "lucide-react";
import { AutomationDetailsMainContentBlockWrapper } from "./block-wrapper";

type TProps = {
  label: string;
  isSelected?: boolean;
  onClick: () => void;
};

export function AutomationDetailsMainContentAddNodeButton(props: TProps) {
  const { label, isSelected, onClick } = props;

  return (
    <AutomationDetailsMainContentBlockWrapper isSelected={isSelected} onClick={onClick}>
      <button
        type="button"
        className="flex-grow w-full h-14 flex items-center justify-center outline-none border-none transition-all text-tertiary hover:text-primary"
        onClick={onClick}
      >
        <span className="flex items-center gap-1.5">
          <PlusCircle className="flex-shrink-0 size-4 transition-colors" />
          <p className="text-13 font-medium transition-colors">{label}</p>
        </span>
      </button>
    </AutomationDetailsMainContentBlockWrapper>
  );
}
