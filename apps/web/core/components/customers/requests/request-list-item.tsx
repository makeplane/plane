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
import { PlusIcon, WorkItemsIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { CustomerService } from "@plane/services";
import type { ISearchIssueResponse, TProjectIssuesSearchParams } from "@plane/types";
// components
import { ContentOverflowWrapper } from "@/components/core/content-overflow-HOC";
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
import { RichTextEditor } from "@/components/editor/rich-text";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web components
import {
  SourceItem,
  CustomerRequestForm,
  SourceCreateUpdateModal,
  RequestWorkItemsListCollapsible,
  RequestAttachmentsCollapsible,
} from "@/components/customers";
import { CustomerRequestQuickActions } from "@/components/customers/actions";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  requestId: string;
  customerId: string;
  workspaceSlug: string;
  isEditable?: boolean;
};

const customerService = new CustomerService();

export const CustomerRequestListItem = observer(function CustomerRequestListItem(props: TProps) {
  const { requestId, workspaceSlug, customerId, isEditable = false } = props;
  // states
  const [isEditing, setEditing] = useState<boolean>(false);
  const [workItemsModal, setWorkItemsModal] = useState<boolean>(false);
  const [link, setLink] = useState<string | undefined>();
  // refs
  const parentRef = useRef(null);
  // i18n
  const { t } = useTranslation();
  // hooks
  const {
    getRequestById,
    updateCustomerRequest,
    toggleRequestSourceModal,
    workItems: { addWorkItemsToCustomer },
  } = useCustomers();
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const request = getRequestById(requestId);
  const requestWorkItemsCount = request?.work_item_ids?.length || 0;
  const workspaceDetails = getWorkspaceBySlug(workspaceSlug);

  const workItemSearchCallBack = (params: TProjectIssuesSearchParams) =>
    customerService.workItemsSearch(workspaceSlug, customerId, { ...params, customer_request_id: requestId });

  const handleUpdateSource = (link: string) => {
    updateCustomerRequest(workspaceSlug, customerId, requestId, { link })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("customers.requests.toasts.source.update.success.title"),
          message: t("customers.requests.toasts.source.update.success.message"),
        });
        return;
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

  const handleAddWorkItemsToRequest = async (data: ISearchIssueResponse[]) => {
    const workItemIds = data.map((item) => item.id);
    await addWorkItemsToCustomer(workspaceSlug, customerId, workItemIds, requestId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("customers.requests.toasts.work_item.add.success.title"),
          message: t("customers.requests.toasts.work_item.add.success.message"),
        });
        return;
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("customers.requests.toasts.work_item.add.error.title"),
          message: error.error || t("customers.requests.toasts.work_item.add.error.message"),
        });
      });
  };

  const handleOpenUrl = (link: string) => window.open(link, "_blank");

  const handleEdit = () => {
    setEditing(true);
  };

  useEffect(() => {
    if (link !== request?.link && link) {
      handleUpdateSource(link);
    }
  }, [link]);

  useEffect(() => {
    if (request?.link) setLink(request.link);
  }, [request]);
  if (!request) return null;
  return (
    <>
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        isOpen={workItemsModal}
        handleClose={() => setWorkItemsModal(false)}
        searchParams={{}}
        handleOnSubmit={handleAddWorkItemsToRequest}
        workItemSearchServiceCallback={workItemSearchCallBack}
      />
      <SourceCreateUpdateModal id={request.id} setLinkData={setLink} preloadedData={{ url: link }} />
      {isEditing && request && (
        <CustomerRequestForm
          isOpen={isEditing}
          handleClose={() => setEditing(false)}
          workspaceSlug={workspaceSlug}
          customerId={customerId}
          data={request}
        />
      )}
      <div className="border-[0.5px] border-subtle-1 rounded-md shadow-sm p-4 bg-layer-1">
        <div className="flex justify-between" ref={parentRef}>
          <p className="text-14 font-medium">{request.name}</p>
          <CustomerRequestQuickActions
            customerId={customerId}
            requestId={requestId}
            parentRef={parentRef}
            handleEdit={handleEdit}
            workspaceSlug={workspaceSlug}
          />
        </div>
        {request.description_html ? (
          <ContentOverflowWrapper maxHeight={200} fallback={<div className="py-1" />}>
            <RichTextEditor
              editable={false}
              id={customerId}
              initialValue={request.description_html ?? ""}
              workspaceId={workspaceDetails?.id ?? ""}
              workspaceSlug={workspaceSlug}
              containerClassName="border-none ring-none outline-non text-13 !px-0 py-2"
              editorClassName="px-0"
              displayConfig={{
                fontSize: "small-font",
              }}
            />
          </ContentOverflowWrapper>
        ) : (
          <div className="py-1" />
        )}
        <div className="mt-2" />
        {isEditable && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="text-secondary bg-layer-2 text-13 px-2 hover:bg-layer-2-hover hover:shadow-raised-100"
              onClick={() => {
                if (!link) toggleRequestSourceModal(request.id);
                else handleOpenUrl(link);
              }}
            >
              {link ? (
                <SourceItem link={link} />
              ) : (
                <>
                  <Database className="size-3" /> {t("customers.requests.form.source.add")}
                </>
              )}
            </Button>
            {!request.link && requestWorkItemsCount === 0 && (
              <Button
                variant="secondary"
                onClick={() => setWorkItemsModal(true)}
                className="text-secondary bg-layer-2 hover:bg-layer-2-hover text-13"
              >
                <WorkItemsIcon className="size-3" />
                {t("customers.linked_work_items.link")}
              </Button>
            )}
          </div>
        )}
        <div className="mt-3">
          {requestWorkItemsCount > 0 && (
            <div className="pt-2 mt-2 border-t-[0.5px] border-subtle-1 w-full">
              <RequestWorkItemsListCollapsible
                workspaceSlug={workspaceSlug}
                openWorkItemModal={() => setWorkItemsModal(true)}
                workItemIds={request.work_item_ids}
                customerId={customerId}
                requestId={requestId}
                isEditable={isEditable}
              />
            </div>
          )}
          <div className="pt-2 mt-2 border-t-[0.5px] border-subtle-1 w-full">
            <RequestAttachmentsCollapsible
              workspaceSlug={workspaceSlug}
              customerId={customerId}
              requestId={requestId}
              isEditable={isEditable}
            />
          </div>
          {request.link && requestWorkItemsCount === 0 && isEditable && (
            <div className="pt-2 mt-2 border-t-[0.5px] border-subtle-1 w-full">
              <div
                className="flex gap-2 items-center text-13 cursor-pointer text-secondary font-medium"
                onClick={() => setWorkItemsModal(true)}
              >
                <PlusIcon className="size-4" /> {t("customers.linked_work_items.link")}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
});
