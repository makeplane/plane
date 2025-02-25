import React, { FC, useRef, useState } from "react";
import { v4 } from "uuid";
import { ChevronRight, Plus } from "lucide-react";
import { EIssuePropertyType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TCreationListModes, TIssueProperty } from "@plane/types";
import { Button, Collapsible } from "@plane/ui";
import { cn } from "@/helpers/common.helper";
import { CustomerPropertiesEmptyState } from "./empty-state";

export type TCustomerPropertyCreateList = Partial<TIssueProperty<EIssuePropertyType>> & {
  key: string;
};

export const defaultCustomProperty: Partial<TIssueProperty<EIssuePropertyType>> = {
  id: undefined,
  display_name: "",
  property_type: undefined,
  relation_type: undefined,
  is_multi: false,
  is_active: false,
  is_required: false,
};

export const CustomerCustomPropertiesRoot: FC = () => {
  // states
  const [isOpen, setIsOpen] = useState(true);
  const [customerPropertyCreateList, setCustomerPropertyCreateList] = useState<TCustomerPropertyCreateList[]>([]);
  // hooks
  const { t } = useTranslation();

  // derived
  const isAnyPropertiesAvailable = customerPropertyCreateList.length > 0;

  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const lastElementRef = useRef<HTMLDivElement>(null);

  // handlers
  const handleCustomerPropertiesCreate = (mode: TCreationListModes, value: TCustomerPropertyCreateList) => {
    switch (mode) {
      case "add":
        setCustomerPropertyCreateList((prevValue) => {
          prevValue = prevValue ? [...prevValue] : [];
          return [...prevValue, value];
        });
        break;
      case "remove":
        if (value) {
          setCustomerPropertyCreateList((prevValue) => {
            prevValue = prevValue ? [...prevValue] : [];
            return prevValue.filter((item) => item.key !== value.key);
          });
        }
        break;
      default:
        break;
    }
  };
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
              <h3 className="text-base font-medium">{t("customers.properties.custom.title")}</h3>
              <p className="text-sm text-custom-text-300">{t("customers.properties.custom.info")}</p>
            </div>
          </div>
        }
        buttonClassName={cn("flex w-full py-3 gap-2 items-center justify-between")}
      >
        <div className="pb-4">
          {isAnyPropertiesAvailable ? (
            <>
              <div className={cn("flex items-center py-2", !isAnyPropertiesAvailable && "justify-center")}>
                <Button
                  variant="accent-primary"
                  size="sm"
                  className="rounded-md"
                  onClick={() => {
                    handleCustomerPropertiesCreate("add", {
                      key: v4(),
                      ...defaultCustomProperty,
                    });
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("customers.properties.add.primary_button")}
                </Button>
              </div>
            </>
          ) : (
            <CustomerPropertiesEmptyState handleCustomerPropertiesCreate={handleCustomerPropertiesCreate} />
          )}
        </div>
      </Collapsible>
    </div>
  );
};
