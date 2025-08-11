import React, { FC, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Database } from "lucide-react";
import { CUSTOMER_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, CustomersIcon, setToast, TOAST_TYPE } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// components
import { RichTextEditor } from "@/components/editor";
// plane web imports
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useWorkspace } from "@/hooks/store";
import { SourceItem, SourceCreateUpdateModal, RequestAttachmentsCollapsible } from "@/plane-web/components/customers";
import { CustomerRequestQuickActions } from "@/plane-web/components/customers/actions";
import { useCustomers } from "@/plane-web/hooks/store";
// local imports
import { WorkItemRequestForm } from "./form";

type TProps = {
  requestId: string;
  workspaceSlug: string;
  isEditable?: boolean;
  workItemId: string;
};

export const WorkItemRequestListItem: FC<TProps> = observer((props) => {
  const { requestId, workspaceSlug, isEditable = false, workItemId } = props;
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
  } = useCustomers();
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const request = getRequestById(requestId);
  const customerId = request?.customer_id ?? "";
  const customer = getCustomerById(customerId);
  const workspaceDetails = getWorkspaceBySlug(workspaceSlug);

  const handleUpdateSource = (link: string) => {
    updateCustomerRequest(workspaceSlug, customerId, requestId, { link })
      .then(() => {
        captureSuccess({
          eventName: CUSTOMER_TRACKER_EVENTS.update_request,
          payload: {
            id: customerId,
            request_id: requestId,
          },
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("customers.requests.toasts.source.update.success.title"),
          message: t("customers.requests.toasts.source.update.success.message"),
        });
      })
      .catch((error) => {
        captureError({
          eventName: CUSTOMER_TRACKER_EVENTS.update_request,
          payload: {
            id: customerId,
            request_id: requestId,
          },
          error: error as Error,
        });
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
      <div className="border-[0.5px] border-custom-border-200 rounded-md shadow-sm p-4 bg-custom-background-90/80">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1 px-2 py-1 bg-custom-background-100 border border-custom-border-200 rounded-md">
            <div className="p-1">
              {customer?.logo_url ? (
                <img
                  src={getFileURL(customer.logo_url)}
                  alt="customer-logo"
                  className="rounded-sm w-3 h-3 object-cover"
                />
              ) : (
                <div className="bg-custom-background-90 rounded-md flex items-center justify-center h-3 w-3">
                  <CustomersIcon className="size-4 opacity-50" />
                </div>
              )}
            </div>
            <div className="text-custom-text-200 flex flex-col">
              <span className="text-sm  font-medium">{customer?.name}</span>
            </div>
          </div>
          <CustomerRequestQuickActions
            customerId={customerId}
            requestId={requestId}
            parentRef={parentRef}
            handleEdit={handleEdit}
            workspaceSlug={workspaceSlug}
            workItemId={workItemId}
          />
        </div>
        <div className="flex justify-between" ref={parentRef}>
          <p className="text-base font-medium">{request.name}</p>
        </div>
        {request.description_html ? (
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
        ) : (
          <div className="py-1" />
        )}
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
      </div>
    </>
  );
});
