import React, { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Collapsible, CollapsibleButton } from "@plane/ui";
import { cn } from "@plane/utils";

type TTemplateCollapsibleWrapper = {
  title: string;
  children: React.ReactNode;
  actionElement?: React.ReactNode;
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
        <CollapsibleButton
          isOpen={isOpen}
          title={
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div>{title}</div>
                {isOptional && (
                  <div className="flex items-center gap-1.5 text-sm italic text-custom-text-400">
                    <svg viewBox="0 0 2 2" className="h-1 w-1 fill-current">
                      <circle cx={1} cy={1} r={1} />
                    </svg>
                    {t("common.optional")}
                  </div>
                )}
              </div>
              {actionElement && actionElement}
            </div>
          }
          className="border-none px-0"
          titleClassName={cn(isOpen ? "text-custom-text-100" : "text-custom-text-300 hover:text-custom-text-200")}
        />
      }
      className={cn("py-2.5", { "border-b border-custom-border-200": showBottomBorder })}
    >
      {children}
    </Collapsible>
  );
});
