import React, { FC, SyntheticEvent } from "react";
// plane imports
import { observer } from "mobx-react";
import { usePlatformOS } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { CustomerRequestIcon,CustomersIcon } from "@plane/propel/icons";
// components
import type { TWorkItemLayoutAdditionalProperties } from "@/ce/components/issues/issue-layouts/additional-properties";
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/properties/with-display-properties-HOC";
import { useCustomers } from "@/plane-web/hooks/store";

export const WorkItemLayoutAdditionalProperties: FC<TWorkItemLayoutAdditionalProperties> = observer((props) => {
  const { displayProperties, issue } = props;
  // i18n
  const { t } = useTranslation();
  // hooks
  const { isMobile } = usePlatformOS();
  const {
    isCustomersFeatureEnabled,
    workItems: { getCustomerCountByWorkItemId },
  } = useCustomers();

  const customerCount = getCustomerCountByWorkItemId(issue.id);

  const handleEventPropagation = (e: SyntheticEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <>
      {/* Customer Request Count */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="customer_request_count"
        shouldRenderProperty={(properties) =>
          !!properties.customer_request_count && !!issue.customer_request_ids?.length && !!isCustomersFeatureEnabled
        }
      >
        <Tooltip
          tooltipHeading={t("issue.display.properties.customer_request_count")}
          tooltipContent={`${issue.customer_request_ids?.length ?? 0}`}
          isMobile={isMobile}
          renderByDefault={false}
        >
          <div
            className="flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded border-[0.5px] border-custom-border-300 px-2.5 py-1"
            onFocus={handleEventPropagation}
            onClick={handleEventPropagation}
          >
            <CustomerRequestIcon className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{issue.customer_request_ids?.length ?? 0}</div>
          </div>
        </Tooltip>
      </WithDisplayPropertiesHOC>
      {/* Customer Count */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="customer_count"
        shouldRenderProperty={(properties) =>
          !!properties.customer_count && !!customerCount && !!isCustomersFeatureEnabled
        }
      >
        <Tooltip
          tooltipHeading={t("issue.display.properties.customer_count")}
          tooltipContent={`${customerCount}`}
          isMobile={isMobile}
          renderByDefault={false}
        >
          <div
            className="flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded border-[0.5px] border-custom-border-300 px-2.5 py-1"
            onFocus={handleEventPropagation}
            onClick={handleEventPropagation}
          >
            <CustomersIcon className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{customerCount}</div>
          </div>
        </Tooltip>
      </WithDisplayPropertiesHOC>
    </>
  );
});
