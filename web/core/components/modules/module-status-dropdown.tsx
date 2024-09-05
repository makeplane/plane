import { MODULE_STATUS } from '@/constants/module'
import { IModule } from '@plane/types';
import { CustomSelect, TModuleStatus, ModuleStatusIcon } from '@plane/ui'
import { observer } from 'mobx-react';
import React, { FC } from 'react'

type Props = {
    isEditingAllowed: boolean;
    moduleDetails: IModule;
    handleModuleDetailsChange: (payload: Partial<IModule>) => Promise<void>;
};

export const ModuleStatusSelection : FC<Props> = observer((props : Props) => {
    const {isEditingAllowed, moduleDetails, handleModuleDetailsChange} = props;
    const moduleStatus = MODULE_STATUS.find((status) => status.value === moduleDetails.status);

    if(!moduleStatus) return <></>

return (
    <CustomSelect
        customButton={
            <span
            className={`flex h-6 w-20 items-center justify-center rounded-sm text-center text-xs ${
                isEditingAllowed ? "cursor-pointer" : "cursor-not-allowed"
            }`}
            style={{
                color: moduleStatus ? moduleStatus.color : "#a3a3a2",
                backgroundColor: moduleStatus ? `${moduleStatus.color}20` : "#a3a3a220",
            }}
            >
            {moduleStatus?.label ?? "Backlog"}
            </span>
        }
        value={moduleStatus?.value}
        onChange={(val: TModuleStatus)=>{
            handleModuleDetailsChange({status: val})
        }}
        disabled={!isEditingAllowed}
    >
        {MODULE_STATUS.map((status) => (
            <CustomSelect.Option key={status.value} value={status.value}>
            <div className="flex items-center gap-2">
                <ModuleStatusIcon status={status.value} />
                {status.label}
            </div>
            </CustomSelect.Option>
        ))}
        </CustomSelect>
    )
})