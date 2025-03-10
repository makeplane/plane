"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { IState } from "@plane/types";
import { StateGroupIcon } from "@plane/ui";
// plane web components
import { Dropdown } from "@/plane-web/components/importers/ui";
import { useTranslation } from "@plane/i18n";

type TStateFormSelection = {
  title: string;
  value: string | undefined;
  handleValue: (value: IState | undefined) => void;
  planeStates: IState[];
};

export const StateFormSelection: FC<TStateFormSelection> = observer((props) => {
  const { title, value, handleValue, planeStates } = props;
  const { t } = useTranslation();

  return (
    <div className="relative grid grid-cols-2 items-center space-y-1.5 text-sm">
      <div className="text-custom-text-200">{title}</div>
      <div>
        <Dropdown
          dropdownOptions={(planeStates || [])?.map((state) => ({
            key: state.id,
            label: state.name,
            value: state.id,
            data: state,
          }))}
          value={value}
          placeHolder={t("integrations.select_state")}
          onChange={(value: string | undefined) => {
            if (value) {
              const state = planeStates.find((state) => state.id === value);
              handleValue(state || undefined);
            } else handleValue(undefined);
          }}
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
