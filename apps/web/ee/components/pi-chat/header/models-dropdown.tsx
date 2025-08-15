"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
import { CustomMenu, PiIcon } from "@plane/ui";
import { cn } from "@plane/utils";
import { TAiModels } from "@/plane-web/types";

export type TModelsDropdown = {
  className?: string;
  models: TAiModels[];
  activeModel: TAiModels | undefined;
  setActiveModel: (model: TAiModels) => void;
};

export const ModelsDropdown: FC<TModelsDropdown> = observer((props) => {
  const { className, activeModel, models, setActiveModel } = props;

  const DropdownOptions = () =>
    models?.map((model) => (
      <CustomMenu.MenuItem
        key={model.id}
        className="flex items-center gap-2 truncate"
        onClick={() => {
          setActiveModel(model);
        }}
      >
        <div className="truncate font-medium text-xs">{model.name}</div>
      </CustomMenu.MenuItem>
    ));

  return (
    <CustomMenu
      maxHeight={"md"}
      className={cn("flex justify-center text-xs w-fit ", className)}
      placement="bottom-start"
      customButton={
        <button className="flex hover:bg-custom-background-80 p-2 rounded gap-1">
          <span className="font-medium text-sm my-auto"> Pi Chat {activeModel && `(${activeModel?.name})`}</span>
          <ChevronDown className={cn("size-3 my-auto text-custom-text-300 hover:text-custom-text-200 duration-300")} />
        </button>
      }
      customButtonClassName="flex justify-center"
      closeOnSelect
    >
      <DropdownOptions />
    </CustomMenu>
  );
});
