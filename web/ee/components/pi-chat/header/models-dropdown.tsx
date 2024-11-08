"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { cn } from "@plane/editor";
import { CustomMenu } from "@plane/ui";
import { TAiModels } from "@/plane-web/types";

export type TModelsDropdown = {
  customButton: JSX.Element;
  className?: string;
  models: TAiModels[];
  setActiveModel: (model: TAiModels) => void;
};

export const ModelsDropdown: FC<TModelsDropdown> = observer((props) => {
  const { className, customButton, models, setActiveModel } = props;

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
      className={cn("flex justify-center text-xs text-custom-text-200 w-fit ", className)}
      placement="bottom-start"
      customButton={customButton}
      customButtonClassName="flex justify-center"
      closeOnSelect
    >
      <DropdownOptions />
    </CustomMenu>
  );
});
