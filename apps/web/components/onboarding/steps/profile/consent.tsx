/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useId } from "react";
import { Checkbox } from "@makeplane/propel/components/checkbox";

type Props = {
  isChecked: boolean;
  handleChange: (checked: boolean) => void;
};

export function MarketingConsent({ isChecked, handleChange }: Props) {
  const labelId = useId();

  return (
    <div className="flex items-center justify-center gap-1.5">
      <Checkbox
        aria-labelledby={labelId}
        checked={isChecked}
        onCheckedChange={(checked) => handleChange(checked)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleChange(!isChecked);
          }
        }}
      />
      <span id={labelId} className="text-body-xs-regular text-tertiary">
        I agree to Plane marketing communications
      </span>
    </div>
  );
}
