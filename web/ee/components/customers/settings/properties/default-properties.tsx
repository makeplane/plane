import React, { useState } from "react";
import { AlignLeft, ChevronRight, Hash, CircleChevronDown } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Collapsible } from "@plane/ui";
import { cn } from "@/helpers/common.helper";

const DEFAULT_PROPERTIES_LIST = [
  {
    i18n_title: "customers.properties.default.customer_name",
    icon: AlignLeft,
  },
  {
    i18n_title: "customers.properties.default.description",
    icon: AlignLeft,
  },
  {
    i18n_title: "customers.properties.default.email",
    icon: AlignLeft,
  },
  {
    i18n_title: "customers.properties.default.website_url",
    icon: AlignLeft,
  },
  {
    i18n_title: "customers.properties.default.employees",
    icon: Hash,
  },
  {
    i18n_title: "customers.properties.default.domain",
    icon: AlignLeft,
  },
  {
    i18n_title: "customers.properties.default.stage",
    icon: CircleChevronDown,
  },
  {
    i18n_title: "customers.properties.default.contract_status",
    icon: CircleChevronDown,
  },
  {
    i18n_title: "customers.properties.default.revenue",
    icon: Hash,
  },
];

export const CustomerDefaultProperties = () => {
  // states
  const [isOpen, setIsOpen] = useState(true);
  // hooks
  const { t } = useTranslation();
  return (
    <div className="group/issue-type bg-custom-background-90/60 rounded-md px-4">
      <Collapsible
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        title={
          <div className="flex w-full gap-2 cursor-pointer items-center">
            <div className="flex-shrink-0">
              <ChevronRight
                className={cn("flex-shrink-0 size-4 transition-all text-custom-text-300", {
                  "rotate-90": isOpen,
                })}
              />
            </div>
            <div className="text-left">
              <h3 className="text-base font-medium">{t("customers.properties.default.title")}</h3>
            </div>
          </div>
        }
        buttonClassName={cn("flex w-full py-3 gap-2 items-center justify-between")}
      >
        <div className="flex flex-wrap gap-2 pb-4">
          {DEFAULT_PROPERTIES_LIST.map((property) => (
            <div
              key={property.i18n_title}
              className="flex items-center gap-2 bg-custom-primary-0 border border-custom-border-200 rounded-md p-2 cursor-default"
            >
              <property.icon className="size-4" />
              <p className="text-sm text-custom-text-300">{t(property.i18n_title)}</p>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
};
