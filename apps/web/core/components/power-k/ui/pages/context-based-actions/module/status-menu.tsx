"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { Check } from "lucide-react";
// plane imports
import { MODULE_STATUS } from "@plane/constants";
import { ModuleStatusIcon, TModuleStatus } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import type { IModule } from "@plane/types";

type Props = {
  handleClose: () => void;
  handleUpdateModule: (data: Partial<IModule>) => void;
  value: TModuleStatus;
};

export const PowerKModuleStatusMenu: React.FC<Props> = observer((props) => {
  const { handleClose, handleUpdateModule, value } = props;
  // translation
  const { t } = useTranslation();

  return (
    <>
      {MODULE_STATUS.map((status) => (
        <Command.Item
          key={status.value}
          onSelect={() => {
            handleUpdateModule({
              status: status.value,
            });
            handleClose();
          }}
          className="focus:outline-none"
        >
          <div className="flex items-center space-x-3">
            <ModuleStatusIcon status={status.value} height="14px" width="14px" />
            <p>{t(status.i18n_label)}</p>
          </div>
          <div className="flex-shrink-0">{status.value === value && <Check className="size-3" />}</div>
        </Command.Item>
      ))}
    </>
  );
});
