"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { Check } from "lucide-react";
// plane imports
import { MODULE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ModuleStatusIcon, TModuleStatus } from "@plane/propel/icons";

type Props = {
  handleSelect: (data: TModuleStatus) => void;
  value: TModuleStatus;
};

export const PowerKModuleStatusMenu: React.FC<Props> = observer((props) => {
  const { handleSelect, value } = props;
  // translation
  const { t } = useTranslation();

  return (
    <>
      {MODULE_STATUS.map((status) => (
        <Command.Item key={status.value} onSelect={() => handleSelect(status.value)} className="focus:outline-none">
          <div className="flex items-center space-x-3">
            <ModuleStatusIcon status={status.value} className="shrink-0 size-3.5" />
            <p>{t(status.i18n_label)}</p>
          </div>
          <div className="flex-shrink-0">{status.value === value && <Check className="size-3" />}</div>
        </Command.Item>
      ))}
    </>
  );
});
