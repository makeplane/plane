import React, { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Collapsible, DropdownIcon } from "@plane/ui";
import { cn } from "@plane/utils";

type TChildProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type TTemplateCollapsibleWrapper = {
  title: string;
  children: React.ReactNode | ((props: TChildProps) => React.ReactNode);
  actionElement?: React.ReactNode | ((props: TChildProps) => React.ReactNode);
  isOptional?: boolean;
  showBottomBorder?: boolean;
};

export const TemplateCollapsibleWrapper = observer((props: TTemplateCollapsibleWrapper) => {
  const { title, children, actionElement, isOptional = true, showBottomBorder = true } = props;
  // state
  const [isOpen, setIsOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();

  return (
    <Collapsible
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      title={
        <div className="flex w-full items-center gap-3 py-3">
          <DropdownIcon
            className={cn("size-2 text-custom-text-300 hover:text-custom-text-200 duration-300", {
              "-rotate-90": !isOpen,
            })}
          />
          <div className="flex w-full items-center justify-between gap-4">
            <div className="text-base text-custom-text-100 font-medium flex items-center gap-2">
              <div
                className={cn(
                  "flex flex-grow items-center w-full",
                  isOpen ? "text-custom-text-100" : "text-custom-text-300 hover:text-custom-text-200"
                )}
              >
                {title}
              </div>
              {isOptional && (
                <div className="flex items-center gap-1.5 text-sm italic text-custom-text-400">
                  <svg viewBox="0 0 2 2" className="h-1 w-1 fill-current">
                    <circle cx={1} cy={1} r={1} />
                  </svg>
                  {t("common.optional")}
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              {typeof actionElement === "function" ? actionElement({ isOpen, setIsOpen }) : actionElement}
            </div>
          </div>
        </div>
      }
      className={cn("w-full py-3", { "border-b border-custom-border-200": showBottomBorder })}
      buttonClassName="w-full"
    >
      {typeof children === "function" ? children({ isOpen, setIsOpen }) : children}
    </Collapsible>
  );
});
