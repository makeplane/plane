"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { LinearState } from "@plane/etl/linear";
import { IState } from "@plane/types";
import { StateGroupIcon } from "@plane/ui";
// silo ui components
import { Dropdown } from "@/plane-web/components/importers/ui";
import { useTranslation } from "@plane/i18n";

type TMapStatesSelection = {
  value: string | undefined;
  handleValue: (value: string | undefined) => void;
  linearState: LinearState;
  planeStates: IState[];
};

export const MapStatesSelection: FC<TMapStatesSelection> = observer((props) => {
  const { value, handleValue, linearState, planeStates } = props;
  const { t } = useTranslation();

  return (
    <div className="relative grid grid-cols-2 items-center p-3 text-sm">
      <div className="text-custom-text-200">{linearState.name}</div>
      <div>
        <Dropdown
          dropdownOptions={(planeStates || [])?.map((state) => ({
            key: state.id,
            label: state.name,
            value: state.id,
            data: state,
          }))}
          value={value}
          placeHolder={`${t("common.select")} ${t("common.state")}`}
          onChange={(value: string | undefined) => handleValue(value)}
          iconExtractor={(option) => (
            <div className="w-4.5 h-4.5 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
              <StateGroupIcon stateGroup={option?.group || "backlog"} />
            </div>
          )}
          queryExtractor={(option) => option.name}
        />
      </div>
    </div>
  );
});
