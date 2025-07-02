import React, { useState } from "react";
import { AlignLeft, ChevronRight, Hash, CircleChevronDown } from "lucide-react";
// plane i18n
import { useTranslation } from "@plane/i18n";
// plane ui
import { Collapsible } from "@plane/ui";
// helpers
import { cn  } from "@plane/utils";

const DEFAULT_PROPERTIES_LIST = [
  {
    i18n_title: "customers.properties.default.customer_name.name",
    icon: AlignLeft,
  },
  {
    i18n_title: "customers.properties.default.description.name",
    icon: AlignLeft,
  },
  {
    i18n_title: "customers.properties.default.email.name",
    icon: AlignLeft,
  },
  {
    i18n_title: "customers.properties.default.website_url.name",
    icon: AlignLeft,
  },
  {
    i18n_title: "customers.properties.default.employees.name",
    icon: Hash,
  },
  {
    i18n_title: "customers.properties.default.domain.name",
    icon: AlignLeft,
  },
  {
    i18n_title: "customers.properties.default.stage.name",
    icon: CircleChevronDown,
  },
  {
    i18n_title: "customers.properties.default.contract_status.name",
    icon: CircleChevronDown,
  },
  {
    i18n_title: "customers.properties.default.revenue.name",
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
              className="flex items-center gap-2 bg-custom-background-100 border border-custom-border-200 rounded-md p-2 cursor-default"
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
