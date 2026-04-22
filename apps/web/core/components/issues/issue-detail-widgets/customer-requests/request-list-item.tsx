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

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Database } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CustomersIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// components
import { RichTextEditor } from "@/components/editor/rich-text";
// plane web imports
import { useWorkspace } from "@/hooks/store/use-workspace";
import { SourceItem, SourceCreateUpdateModal, RequestAttachmentsCollapsible } from "@/components/customers";
import { getCustomerLogoSrc } from "@/components/customers/utils";
import { CustomerRequestQuickActions } from "@/components/customers/actions";
import { useCustomers } from "@/plane-web/hooks/store";
// local imports
import { WorkItemRequestForm } from "./form";

type TProps = {
  requestId: string;
  workspaceSlug: string;
  workItemId: string;
};

export const WorkItemRequestListItem = observer(function WorkItemRequestListItem(props: TProps) {
  const { requestId, workspaceSlug, workItemId } = props;
  // states
  const [link, setLink] = useState<string | undefined>();
  // refs
  const parentRef = useRef(null);
  // i18n
  const { t } = useTranslation();
  // hooks
  const {
    getRequestById,
    updateCustomerRequest,
    getCustomerById,
    toggleRequestSourceModal,
    toggleCreateUpdateRequestModal,
    createUpdateRequestModalId,
    permissions: customerPermissions,
  } = useCustomers();
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const request = getRequestById(requestId);
  const customerId = request?.customer_id ?? "";
  const customer = getCustomerById(customerId);
  const workspaceDetails = getWorkspaceBySlug(workspaceSlug);
  const customerLogoSrc = getCustomerLogoSrc(customer);
  const requestPermissions = customerPermissions.getRequestPermissions(workspaceSlug, customerId);
  const allRequestPermissions = {
    canCreate: requestPermissions.canCreate,
    canEdit: requestPermissions.getCanEdit(requestId),
    canDelete: requestPermissions.getCanDelete(requestId),
    canAddAttachment: requestPermissions.getCanAddAttachment(requestId),
    canDeleteAttachment: requestPermissions.getCanDeleteAttachment(requestId),
  };

  const handleUpdateSource = (link: string) => {
    updateCustomerRequest(workspaceSlug, customerId, requestId, { link })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("customers.requests.toasts.source.update.success.title"),
          message: t("customers.requests.toasts.source.update.success.message"),
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("customers.requests.toasts.source.update.error.title"),
          message: error.error || error.link[0] || t("customers.requests.toasts.source.update.error.message"),
        });
        setLink(request?.link);
      });
  };

  const handleOpenUrl = (link: string) => window.open(link, "_blank");

  const handleEdit = () => {
    toggleCreateUpdateRequestModal(requestId);
  };

  useEffect(() => {
    if (link !== request?.link && link) {
      handleUpdateSource(link);
    }
  }, [link]);

  useEffect(() => {
    if (request?.link) setLink(request.link);
  }, [request]);
  if (!request || !customerId) return null;
  return (
    <>
      <SourceCreateUpdateModal id={request.id} setLinkData={setLink} preloadedData={{ url: link }} />
      {request && (
        <WorkItemRequestForm
          isOpen={createUpdateRequestModalId === requestId}
          handleClose={() => toggleCreateUpdateRequestModal(null)}
          workspaceSlug={workspaceSlug}
          data={request}
          workItemId={workItemId}
        />
      )}
      <div className="flex flex-col gap-3 border border-subtle rounded-md shadow-sm p-3 bg-layer-1">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 px-1 bg-layer-2 border border-subtle rounded-md h-6">
            {customerLogoSrc ? (
              <img src={customerLogoSrc} alt="customer-logo" className="size-3.5 object-cover" />
            ) : (
              <CustomersIcon className="size-3.5" />
            )}

            <div className="text-caption-md-regular text-tertiary">{customer?.name}</div>
          </div>
          <CustomerRequestQuickActions
            customerId={customerId}
            requestId={requestId}
            parentRef={parentRef}
            handleEdit={handleEdit}
            workspaceSlug={workspaceSlug}
            workItemId={workItemId}
            permissions={allRequestPermissions}
          />
        </div>

        <div className="flex flex-col gap-3 border-b border-subtle pb-4">
          <div className="flex flex-col gap-1">
            <div className="text-body-sm-medium" ref={parentRef}>
              {request.name}
            </div>

            {request.description_html && (
              <RichTextEditor
                editable={false}
                id={customerId}
                initialValue={request.description_html ?? ""}
                workspaceId={workspaceDetails?.id ?? ""}
                workspaceSlug={workspaceSlug}
                containerClassName="border-none ring-none outline-none text-body-xs-regular !px-0 py-0"
                editorClassName="px-0"
                displayConfig={{
                  fontSize: "small-font",
                }}
              />
            )}
          </div>
          {allRequestPermissions.canEdit && (
            <div className="flex">
              <Button
                variant="secondary"
                onClick={() => {
                  if (!link) toggleRequestSourceModal(request.id);
                  else handleOpenUrl(link);
                }}
                prependIcon={!link ? <Database /> : undefined}
              >
                {link ? <SourceItem link={link} /> : <>{t("customers.requests.form.source.add")}</>}
              </Button>
            </div>
          )}
        </div>

        <RequestAttachmentsCollapsible
          workspaceSlug={workspaceSlug}
          customerId={customerId}
          requestId={requestId}
          permissions={allRequestPermissions}
        />
      </div>
    </>
  );
});
