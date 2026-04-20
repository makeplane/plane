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

import React, { useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { NewTabIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tabs } from "@plane/propel/tabs";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EFileAssetType } from "@plane/types";
import type { TCustomerPayload } from "@plane/types";
// components
import { formatURLForDisplay } from "@plane/utils";
// components
import { DescriptionInput } from "@/components/editor/rich-text/description-input";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { TitleInput } from "@/components/common/input/title-input";
import { MainWrapper } from "@/components/common/layout/main/main-wrapper";
import { CustomerRequestsRoot, WorkItemsList } from "@/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";
// services
import { FileService } from "@/services/file.service";
import { getCustomerLogoSrc } from "@/components/customers/utils";
import { CustomerLogoInput } from "./logo-input";
import type { TCustomerDetailPermissions } from "@/store/customers/permissions/root";

const fileService = new FileService();

type TProps = {
  customerId: string;
  workspaceSlug: string;
  permissions: TCustomerDetailPermissions;
};

export const CustomerMainRoot = observer(function CustomerMainRoot(props: TProps) {
  const { customerId, workspaceSlug, permissions } = props;
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
  const { requests, canLinkWorkItem, canUnlinkWorkItem } = permissions;

  const CUSTOMER_TABS = useMemo(
    () => [
      {
        key: "requests",
        label: (
          <div className="flex items-center gap-2">
            <span>{t("customers.requests.label", { count: 2 })}</span>
            {requestCount > 0 ? (
              <span className="rounded-full text-11 bg-layer-1 h-5 w-5 flex items-center justify-center">
                {requestCount}
              </span>
            ) : null}
          </div>
        ),
        content: <CustomerRequestsRoot workspaceSlug={workspaceSlug} customerId={customerId} permissions={requests} />,
      },
      {
        key: "linked_work_items",
        label: (
          <div className="flex items-center gap-2">
            <span>{t("customers.linked_work_items.label")}</span>
            {workItemCount > 0 ? (
              <span className="rounded-full text-11 bg-layer-1 h-5 w-5 flex items-center justify-center">
                {workItemCount}
              </span>
            ) : null}
          </div>
        ),
        content: (
          <WorkItemsList
            customerId={customerId}
            workspaceSlug={workspaceSlug}
            permissions={{ canLinkWorkItem, canUnlinkWorkItem }}
          />
        ),
      },
    ],
    [t, requestCount, workspaceSlug, customerId, requests, canLinkWorkItem, canUnlinkWorkItem, workItemCount]
  );

  const handleOpenLogoInput = () => {
    if (permissions.canEdit) logoInputRef.current?.click();
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
      .then(() => {})
      .catch((_error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("customers.toasts.update.error.title"),
          message: _error?.error || t("customers.toasts.update.error.message"),
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
          customerLogoSrc={getCustomerLogoSrc(customer)}
          logo={logo}
        />
        <div className="w-full">
          <TitleInput
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            onSubmit={(title: string) => handleUpdateCustomer({ name: title })}
            disabled={!permissions.canEdit}
            value={customer.name}
            className="p-0"
          />
          {customer.website_url && (
            <Link
              className="text-13 text-tertiary cursor-pointer hover:underline flex gap-1 items-center w-fit"
              data-prevent-progress
              href={customer.website_url}
              onClick={(e) => {
                e.stopPropagation();
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <NewTabIcon className="text-tertiary size-3" />
              {formatURLForDisplay(customer.website_url)}
            </Link>
          )}
        </div>
      </div>
      {/* Description Editor */}
      <div className="border-subtle-1 border-b-[0.5px] pb-3">
        <DescriptionInput
          containerClassName="border-none min-h-[88px]"
          disabled={!permissions.canEditProperty("description_html")}
          disabledExtensions={["attachments"]}
          entityId={customerId}
          fileAssetType={EFileAssetType.CUSTOMER_DESCRIPTION}
          initialValue={customer.description_html}
          key={customerId}
          onSubmit={async (value) => {
            await handleUpdateCustomer({ description_html: value.description_html });
          }}
          setIsSubmitting={setIsSubmitting}
          workspaceSlug={workspaceSlug}
        />
      </div>
      <div className="mt-4">
        <Tabs defaultValue={CUSTOMER_TABS[0].key}>
          <Tabs.List className="w-fit">
            {CUSTOMER_TABS.map((tab) => (
              <Tabs.Trigger key={tab.key} value={tab.key} size="sm">
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <div className="mt-2">
            {CUSTOMER_TABS.map((tab) => (
              <Tabs.Content key={tab.key} value={tab.key}>
                {tab.content}
              </Tabs.Content>
            ))}
          </div>
        </Tabs>
      </div>
    </MainWrapper>
  );
});
