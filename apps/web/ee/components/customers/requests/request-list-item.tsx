import React, { FC, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Database, LayersIcon, PlusIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { CustomerService } from "@plane/services";
import { ISearchIssueResponse, TProjectIssuesSearchParams } from "@plane/types";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { ExistingIssuesListModal } from "@/components/core";
import { ContentOverflowWrapper } from "@/components/core/content-overflow-HOC";
import { RichTextEditor } from "@/components/editor";
// plane web imports
import { useWorkspace } from "@/hooks/store";
import {
  SourceItem,
  CustomerRequestForm,
  SourceCreateUpdateModal,
  RequestWorkItemsListCollapsible,
  RequestAttachmentsCollapsible,
} from "@/plane-web/components/customers";
import { CustomerRequestQuickActions } from "@/plane-web/components/customers/actions";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  requestId: string;
  customerId: string;
  workspaceSlug: string;
  isEditable?: boolean;
};

const customerService = new CustomerService();

export const CustomerRequestListItem: FC<TProps> = observer((props) => {
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
        selectedWorkItems={[]}
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
      <div className="border-[0.5px] border-custom-border-200 rounded-md shadow-sm p-4 bg-custom-background-90/80">
        <div className="flex justify-between" ref={parentRef}>
          <p className="text-base font-medium">{request.name}</p>
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
              containerClassName="border-none ring-none outline-non text-sm !px-0 py-2"
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
              variant="neutral-primary"
              className="text-custom-text-200 bg-custom-background-100 text-sm px-2 hover:bg-custom-background-100 hover:shadow-custom-shadow"
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
                variant="neutral-primary"
                onClick={() => setWorkItemsModal(true)}
                className="text-custom-text-200 bg-custom-background-100 hover:bg-custom-background-100 text-sm"
              >
                <LayersIcon className="size-3" />
                {t("customers.linked_work_items.link")}
              </Button>
            )}
          </div>
        )}
        <div className="mt-3">
          {requestWorkItemsCount > 0 && (
            <div className="pt-2 mt-2 border-t-[0.5px] border-custom-border-300 w-full">
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
          <div className="pt-2 mt-2 border-t-[0.5px] border-custom-border-300 w-full">
            <RequestAttachmentsCollapsible
              workspaceSlug={workspaceSlug}
              customerId={customerId}
              requestId={requestId}
              isEditable={isEditable}
            />
          </div>
          {request.link && requestWorkItemsCount === 0 && isEditable && (
            <div className="pt-2 mt-2 border-t-[0.5px] border-custom-border-300 w-full">
              <div
                className="flex gap-2 items-center text-sm cursor-pointer text-custom-text-200 font-medium"
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
