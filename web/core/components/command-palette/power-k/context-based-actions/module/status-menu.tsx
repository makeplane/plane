"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { Check } from "lucide-react";
// plane types
import { IModule } from "@plane/types";
// plane ui
import { ModuleStatusIcon, TModuleStatus } from "@plane/ui";
// constants
import { MODULE_STATUS } from "@/constants/module";

type Props = {
  handleClose: () => void;
  handleUpdateModule: (data: Partial<IModule>) => void;
  value: TModuleStatus;
};

export const PowerKModuleStatusMenu: React.FC<Props> = observer((props) => {
  const { handleClose, handleUpdateModule, value } = props;

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
            <p>{status.label}</p>
          </div>
          <div className="flex-shrink-0">{status.value === value && <Check className="size-3" />}</div>
        </Command.Item>
      ))}
    </>
  );
});
