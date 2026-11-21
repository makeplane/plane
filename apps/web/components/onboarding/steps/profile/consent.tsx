/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Checkbox } from "@makeplane/propel/components/checkbox";

type Props = {
  isChecked: boolean;
  handleChange: (checked: boolean) => void;
};

export function MarketingConsent({ isChecked, handleChange }: Props) {
  return (
    <div className="flex w-full justify-center">
      <Checkbox
        label="I agree to Plane marketing communications"
        checked={isChecked}
        onCheckedChange={(checked) => handleChange(checked)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleChange(!isChecked);
          }
        }}
      />
    </div>
  );
}
