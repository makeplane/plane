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

import { useCallback, useEffect, useId } from "react";
import { debounce } from "lodash-es";
// plane imports
import { Input } from "@plane/ui";
// local components
import { WidgetPropertyWrapper } from "../../property-wrapper";

type Props = {
  onChange: (val: string) => void;
  title: string;
  value: string | undefined;
};

export function WidgetColorPicker(props: Props) {
  const { onChange, title, value } = props;
  // unique id
  const id = useId();

  const debouncedColorUpdate = useCallback(
    // eslint-disable-next-line react-hooks/use-memo
    debounce((color: string) => {
      onChange(color);
    }, 500),
    [onChange]
  );

  useEffect(
    () => () => {
      debouncedColorUpdate.cancel();
    },
    [debouncedColorUpdate]
  );

  return (
    <WidgetPropertyWrapper
      title={title}
      input={
        <label
          htmlFor={id}
          className="flex items-center gap-1 px-2 py-1 rounded-sm hover:bg-layer-1 cursor-pointer transition-colors"
        >
          <Input
            id={id}
            type="color"
            value={value}
            onChange={(e) => debouncedColorUpdate(e.target.value)}
            className="custom-color-picker flex-shrink-0 size-4 rounded-sm p-0"
          />
          <p className="flex-shrink-0 text-13">{value?.toUpperCase()}</p>
        </label>
      }
    />
  );
}
