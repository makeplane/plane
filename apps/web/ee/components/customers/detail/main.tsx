import React, { FC, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
// plane imports
import { CUSTOMER_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EFileAssetType, TCustomerPayload } from "@plane/types";
import { setToast, Tabs, TOAST_TYPE } from "@plane/ui";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useWorkspace } from "@/hooks/store";
// plane web imports
import { DescriptionInput, MainWrapper, TitleInput } from "@/plane-web/components/common";
import { CustomerRequestsRoot, WorkItemsList } from "@/plane-web/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";
// services
import { FileService } from "@/services/file.service";
import { CustomerLogoInput } from "./logo-input";

const fileService = new FileService();

type TProps = {
  customerId: string;
  workspaceSlug: string;
  isEditable: boolean;
};

export const CustomerMainRoot: FC<TProps> = observer((props) => {
  const { customerId, workspaceSlug, isEditable = false } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  const [logo, setLogo] = useState<File | null>(null);
  // i18n
  const { t } = useTranslation();
  // hooks
  const { getCustomerById, updateCustomer, customerDetailSidebarCollapsed, getCustomerWorkItemIds } = useCustomers();
  const { currentWorkspace } = useWorkspace();
  // refs
  const logoInputRef = useRef<HTMLInputElement>(null);

  // derived values
  const customer = getCustomerById(customerId.toString());
  const requestCount = customer?.customer_request_count || 0;
  const workItemCount = getCustomerWorkItemIds(customerId.toString())?.length || 0;

  const CUSTOMER_TABS = useMemo(
    () => [
      {
        key: "requests",
        label: (
          <div className="flex items-center gap-2">
            <span>{t("customers.requests.label", { count: 2 })}</span>
            {requestCount > 0 ? (
              <span className="rounded-full text-xs bg-custom-background-90 h-5 w-5 flex items-center justify-center">
                {requestCount}
              </span>
            ) : null}
          </div>
        ),
        content: <CustomerRequestsRoot workspaceSlug={workspaceSlug} customerId={customerId} />,
      },
      {
        key: "linked_work_items",
        label: (
          <div className="flex items-center gap-2">
            <span>{t("customers.linked_work_items.label")}</span>
            {workItemCount > 0 ? (
              <span className="rounded-full text-xs bg-custom-background-90 h-5 w-5 flex items-center justify-center">
                {workItemCount}
              </span>
            ) : null}
          </div>
        ),
        content: <WorkItemsList customerId={customerId} workspaceSlug={workspaceSlug} />,
      },
    ],
    [requestCount, workspaceSlug, customerId, workItemCount]
  );

  const handleOpenLogoInput = () => {
    if (isEditable) logoInputRef.current?.click();
  };

  const onLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || !currentWorkspace || !workspaceSlug) return;
    const image = fileList[0];
    setLogo(image);
    try {
      const { asset_id } = await fileService.uploadWorkspaceAsset(
        workspaceSlug,
        {
          entity_identifier: currentWorkspace.id,
          entity_type: EFileAssetType.CUSTOMER_LOGO,
        },
        image
      );
      if (!asset_id) return;
      await handleUpdateCustomer({ logo_asset: asset_id });
      setLogo(null);
    } catch (error: any) {
      setLogo(null);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("customers.toasts.logo.error.title"),
        message: error?.error || error?.message || t("customers.toasts.logo.error.message"),
      });
    }
  };

  const handleUpdateCustomer = async (data: Partial<TCustomerPayload>) => {
    await updateCustomer(workspaceSlug, customerId, data)
      .then(() => {
        captureSuccess({
          eventName: CUSTOMER_TRACKER_EVENTS.update_customer,
          payload: {
            id: customerId,
          },
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("customers.toasts.update.error.title"),
          message: error.error || t("customers.toasts.update.error.message"),
        });
        captureError({
          eventName: CUSTOMER_TRACKER_EVENTS.update_customer,
          payload: {
            id: customerId,
          },
          error: error as Error,
        });
      });
  };

  if (!customer) return;
  return (
    <MainWrapper isSidebarOpen={!customerDetailSidebarCollapsed}>
      {/* <NameDescriptionUpdateStatus isSubmitting={isSubmitting} /> */}
      <div className="flex gap-2 items-start mb-2">
        <CustomerLogoInput
          handleOpenLogoInput={handleOpenLogoInput}
          onLogoUpload={onLogoUpload}
          logoInputRef={logoInputRef}
          logo_url={customer.logo_url}
          logo={logo}
        />
        <div className="w-full">
          <TitleInput
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            onSubmit={(title: string) => handleUpdateCustomer({ name: title })}
            disabled={!isEditable}
            value={customer.name}
            className="p-0"
          />
          {customer.website_url && (
            <Link
              className="text-sm text-custom-text-300 cursor-pointer hover:underline flex gap-1 items-center w-fit"
              data-prevent-progress
              href={customer.website_url}
              onClick={(e) => {
                e.stopPropagation();
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="text-custom-text-300 size-3" />
              {customer.website_url}
            </Link>
          )}
        </div>
      </div>
      {/* Description Editor */}
      <div className="border-custom-border-200 border-b-[0.5px] pb-3">
        <DescriptionInput
          workspaceSlug={workspaceSlug}
          itemId={customerId}
          initialValue={customer.description_html}
          swrDescription={customer.description_html}
          onSubmit={(value: string) => handleUpdateCustomer({ description_html: value })}
          fileAssetType={EFileAssetType.CUSTOMER_DESCRIPTION}
          setIsSubmitting={setIsSubmitting}
          containerClassName="border-none min-h-[88px]"
          disabled={!isEditable}
          disabledExtensions={["attachments"]}
        />
      </div>
      <Tabs
        tabs={CUSTOMER_TABS}
        defaultTab="requests"
        tabListClassName="w-36"
        tabListContainerClassName="justify-between pb-4 pt-6"
        tabClassName="px-2 py-1"
        storeInLocalStorage={false}
        actions={<></>}
      />
    </MainWrapper>
  );
});
