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

import type { FC } from "react";
import { observer } from "mobx-react";
import { Ban } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { StateGroupIcon } from "@plane/propel/icons";
import type { IState } from "@plane/types";
// plane web components
import { Dropdown } from "@/components/importers/ui";

type TSelectProjectState = {
  title: string;
  value: string | undefined;
  handleValue: (value: IState | undefined) => void;
  planeStates: IState[];
};

export const SelectProjectState = observer(function SelectProjectState(props: TSelectProjectState) {
  const { title, value, handleValue, planeStates } = props;
  const { t } = useTranslation();

  return (
    <div className="relative grid grid-cols-2 items-center space-y-1.5 text-body-xs-regular">
      <div className="text-secondary">{title}</div>
      <div>
        <Dropdown
          dropdownOptions={(planeStates || [])?.map((state) => ({
            key: state.id,
            label: state.name,
            value: state.id,
            data: state,
          }))}
          value={value}
          placeHolder={t("integrations.set_state")}
          onChange={(value: string | undefined) => {
            if (value) {
              const state = planeStates.find((state) => state.id === value);
              handleValue(state || undefined);
            } else handleValue(undefined);
          }}
          iconExtractor={(option) => {
            if (!option.id) {
              return (
                <div className="w-2.5 h-2.5 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
                  <Ban />
                </div>
              );
            }
            return (
              <div className="w-4.5 h-4.5 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
                <StateGroupIcon stateGroup={option?.group || "backlog"} />
              </div>
            );
          }}
          queryExtractor={(option) => option.name}
        />
      </div>
    </div>
  );
});
