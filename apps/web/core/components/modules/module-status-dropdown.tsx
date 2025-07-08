import React, { FC } from "react";
import { observer } from "mobx-react";
import { MODULE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IModule } from "@plane/types";
import { CustomSelect, TModuleStatus, ModuleStatusIcon } from "@plane/ui";

type Props = {
  isDisabled: boolean;
  moduleDetails: IModule;
  handleModuleDetailsChange: (payload: Partial<IModule>) => Promise<void>;
};

export const ModuleStatusDropdown: FC<Props> = observer((props: Props) => {
  const { isDisabled, moduleDetails, handleModuleDetailsChange } = props;
  const { t } = useTranslation();
  const moduleStatus = MODULE_STATUS.find((status) => status.value === moduleDetails.status);

  if (!moduleStatus) return <></>;

  return (
    <CustomSelect
      customButton={
        <span
          className={`flex h-6 w-20 items-center justify-center rounded-sm text-center text-xs ${
            isDisabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
          style={{
            color: moduleStatus ? moduleStatus.color : "#a3a3a2",
            backgroundColor: moduleStatus ? `${moduleStatus.color}20` : "#a3a3a220",
          }}
        >
          {(moduleStatus && t(moduleStatus?.i18n_label)) ?? t("project_modules.status.backlog")}
        </span>
      }
      value={moduleStatus?.value}
      onChange={(val: TModuleStatus) => {
        handleModuleDetailsChange({ status: val });
      }}
      disabled={isDisabled}
    >
      {MODULE_STATUS.map((status) => (
        <CustomSelect.Option key={status.value} value={status.value}>
          <div className="flex items-center gap-2">
            <ModuleStatusIcon status={status.value} />
            {t(status.i18n_label)}
          </div>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
});
