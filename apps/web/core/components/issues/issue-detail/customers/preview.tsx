/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { NewTabIcon, CustomersIcon } from "@plane/propel/icons";
import { CUSTOMER_CONTRACT_STATUS, CUSTOMER_STAGES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
import type { TCustomer } from "@plane/types";
import { formatURLForDisplay } from "@plane/utils";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { getAbbreviatedNumber, getCustomerLogoSrc } from "@/components/customers/utils";
import { useMember } from "@/hooks/store/use-member";
type TProps = {
  customer: TCustomer;
  workspaceSlug: string;
};
export function CustomerPreview(props: TProps) {
  const { customer, workspaceSlug } = props;
  // hooks
  const { t } = useTranslation();
  const { getUserDetails } = useMember();
  // derived values
  const createdByDetails = customer ? getUserDetails(customer.created_by) : undefined;
  const contractStatus = CUSTOMER_CONTRACT_STATUS.find((status) => status.value === customer?.contract_status);
  const stage = CUSTOMER_STAGES.find((stage) => stage.value === customer?.stage);
  const customerLogoSrc = getCustomerLogoSrc(customer);
  return (
    <div className="bg-layer-1/40" data-prevent-outside-click>
      <div className={"min-w-[350px] max-w-[400px]"}>
        <div className="bg-surface-1 border border-subtle-1 rounded-lg p-5 shadow-raised-100">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center truncate">
              <div className="border border-subtle-1 rounded-md">
                {customerLogoSrc ? (
                  <img src={customerLogoSrc} alt="customer-logo" className="rounded-md w-8 h-8 object-cover" />
                ) : (
                  <div className="bg-layer-1 rounded-md flex items-center justify-center p-1.5">
                    <CustomersIcon className="size-6 opacity-50" />
                  </div>
                )}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-secondary text-14 font-medium truncate">{customer.name}</span>
                {customer.website_url && (
                  <Link
                    className="text-13 text-tertiary truncate cursor-pointer hover:underline flex gap-1 items-center w-full"
                    data-prevent-progress
                    href={customer.website_url}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <NewTabIcon className="text-tertiary size-3" />
                    <span className="truncate">{formatURLForDisplay(customer.website_url)}</span>
                  </Link>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <Button
                variant="secondary"
                className="bg-surface-1"
                onClick={() => {
                  window.open(`/${workspaceSlug}/customers/${customer.id}`, "_blank");
                }}
              >
                <span className="text-11">{t("customers.open")}</span>
              </Button>
            </div>
          </div>
          <div className="mt-2">
            <PreviewProperty name={t("customers.properties.default.requests.name")}>
              <span className="text-13">{customer.customer_request_count || 0}</span>
            </PreviewProperty>
          </div>
          <div className="border-b border-subtle my-1 w-full" />
          <div className="space-y-1">
            <PreviewProperty name={t("customers.properties.default.email.name")}>
              <Tooltip tooltipContent={<span className="text-11">{customer.email}</span>}>
                <span className="text-13 truncate">{customer.email}</span>
              </Tooltip>
            </PreviewProperty>
            <PreviewProperty name={t("customers.properties.default.size.name")}>
              <span className="text-13 truncate">{customer.employees || 0}</span>
            </PreviewProperty>
            <PreviewProperty name={t("customers.properties.default.domain.name")}>
              <span className="text-13 truncate">{customer.employees || 0}</span>
            </PreviewProperty>
            <PreviewProperty name={t("customers.properties.default.contract_status.name")}>
              <div className="flex items-center gap-2">
                {contractStatus ? (
                  <>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: contractStatus.color || "" }} />
                    <p className="text-13">{t(contractStatus.i18n_name)}</p>
                  </>
                ) : (
                  <p className="text-13">{t("common.none")}</p>
                )}
              </div>
            </PreviewProperty>
            <PreviewProperty name={t("customers.properties.default.stage.name")}>
              <span className="text-13">{t(stage?.i18n_name || "common.none")}</span>
            </PreviewProperty>
            <PreviewProperty name={t("customers.properties.default.revenue.name")}>
              <div className="w-3/5 grow">
                <span className="text-13">$ {getAbbreviatedNumber(customer.revenue || 0)}</span>
              </div>
            </PreviewProperty>
            {createdByDetails ? (
              <div className="flex h-8 gap-2 items-center">
                <div className="w-2/5 shrink-0">
                  <span className="text-13 text-secondary">{t("common.created_by")}</span>
                </div>
                <div className="w-full h-full flex items-center gap-1.5 rounded-sm py-0.5 text-13 justify-between cursor-not-allowed">
                  <ButtonAvatars showTooltip userIds={createdByDetails.id} />
                  <span className="grow truncate text-13 leading-5">{createdByDetails?.display_name}</span>
                </div>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
type TPreviewProps = {
  name: string;
  children: ReactNode;
};

function PreviewProperty(props: TPreviewProps) {
  return (
    <div className="flex h-8 gap-2 items-center">
      <div className="w-2/5 shrink-0">
        <span className="text-13 text-tertiary">{props.name}</span>
      </div>
      <div className="w-3/5 grow truncate">{props.children}</div>
    </div>
  );
}
