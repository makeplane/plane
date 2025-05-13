import React, { FC, ReactNode } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { CUSTOMER_CONTRACT_STATUS, CUSTOMER_STAGES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TCustomer } from "@plane/types";
import { Button, CustomersIcon, Tooltip } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { useMember } from "@/hooks/store";
import { getAbbreviatedNumber } from "@/plane-web/components/customers/utils";
type TProps = {
  customer: TCustomer;
  setPopperElement: React.Dispatch<React.SetStateAction<HTMLDivElement | null>>;
  styles: { [key: string]: React.CSSProperties };
  workspaceSlug: string;
};
export const CustomerPreview: FC<TProps> = (props) => {
  const { customer, setPopperElement, styles, workspaceSlug } = props;
  // hooks
  const { t } = useTranslation();
  const { getUserDetails } = useMember();
  // derived values
  const createdByDetails = customer ? getUserDetails(customer.created_by) : undefined;
  const contractStatus = CUSTOMER_CONTRACT_STATUS.find((status) => status.value === customer?.contract_status);
  const stage = CUSTOMER_STAGES.find((stage) => stage.value === customer?.stage);
  return (
    <div className="bg-custom-background-90/40">
      <div ref={setPopperElement} className={"min-w-[350px] max-w-[400px] z-20"} style={styles.popper}>
        <div className="bg-custom-background-100 border border-custom-border-200 rounded-lg p-5 shadow-custom-shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <div className="border border-custom-border-200 rounded-md">
                {customer.logo_url ? (
                  <img
                    src={getFileURL(customer.logo_url)}
                    alt="customer-logo"
                    className="rounded-md w-8 h-8 object-cover"
                  />
                ) : (
                  <div className="bg-custom-background-90 rounded-md flex items-center justify-center p-1.5">
                    <CustomersIcon className="size-6 opacity-50" />
                  </div>
                )}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-custom-text-200 text-base font-medium">{customer.name}</span>
                {customer.website_url && (
                  <Link
                    className="text-sm text-custom-text-300 truncate cursor-pointer hover:underline flex gap-1 items-center w-full"
                    data-prevent-nprogress
                    href={customer.website_url}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="text-custom-text-300 size-3" />
                    <span className="truncate">{customer.website_url}</span>
                  </Link>
                )}
              </div>
            </div>
            <div>
              <Button
                variant="neutral-primary"
                size="sm"
                className="bg-custom-background-100"
                onClick={() => {
                  window.open(`/${workspaceSlug}/customers/${customer.id}`, "_blank");
                }}
              >
                <span className="text-xs">{t("customers.open")}</span>
              </Button>
            </div>
          </div>
          <div className="mt-2">
            <PreviewProperty name={t("customers.properties.default.requests.name")}>
              <span className="text-sm">{customer.customer_request_count || 0}</span>
            </PreviewProperty>
          </div>
          <div className="border-b border-custom-border-100 my-1 w-full" />
          <div className="space-y-1">
            <PreviewProperty name={t("customers.properties.default.email.name")}>
              <Tooltip tooltipContent={<span className="text-xs">{customer.email}</span>}>
                <span className="text-sm truncate">{customer.email}</span>
              </Tooltip>
            </PreviewProperty>
            <PreviewProperty name={t("customers.properties.default.size.name")}>
              <span className="text-sm truncate">{customer.employees || 0}</span>
            </PreviewProperty>
            <PreviewProperty name={t("customers.properties.default.domain.name")}>
              <span className="text-sm truncate">{customer.employees || 0}</span>
            </PreviewProperty>
            <PreviewProperty name={t("customers.properties.default.contract_status.name")}>
              <div className="flex items-center gap-2">
                {contractStatus ? (
                  <>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: contractStatus.color || "" }} />
                    <p className="text-sm">{t(contractStatus.i18n_name)}</p>
                  </>
                ) : (
                  <p className="text-sm">{t("common.none")}</p>
                )}
              </div>
            </PreviewProperty>
            <PreviewProperty name={t("customers.properties.default.stage.name")}>
              <span className="text-sm">{t(stage?.i18n_name || "common.none")}</span>
            </PreviewProperty>
            <PreviewProperty name={t("customers.properties.default.revenue.name")}>
              <div className="w-3/5 flex-grow">
                <span className="text-sm">$ {getAbbreviatedNumber(customer.revenue || 0)}</span>
              </div>
            </PreviewProperty>
            {createdByDetails ? (
              <div className="flex h-8 gap-2 items-center">
                <div className="w-2/5 flex-shrink-0">
                  <span className="text-sm text-custom-text-200">{t("common.created_by")}</span>
                </div>
                <div className="w-full h-full flex items-center gap-1.5 rounded py-0.5 text-sm justify-between cursor-not-allowed">
                  <ButtonAvatars showTooltip userIds={createdByDetails.id} />
                  <span className="flex-grow truncate text-sm leading-5">{createdByDetails?.display_name}</span>
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
};
type TPreviewProps = {
  name: string;
  children: ReactNode;
};
const PreviewProperty: FC<TPreviewProps> = (props) => (
  <div className="flex h-8 gap-2 items-center">
    <div className="w-2/5 flex-shrink-0">
      <span className="text-sm text-custom-text-300">{props.name}</span>
    </div>
    <div className="w-3/5 flex-grow truncate">{props.children}</div>
  </div>
);
