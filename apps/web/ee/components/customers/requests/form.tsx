import React, { FC, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Database, Paperclip } from "lucide-react";
// plane imports
import { CUSTOMER_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { LayersIcon } from "@plane/propel/icons";
import { CustomerService } from "@plane/services";
import { EFileAssetType, ISearchIssueResponse, TCustomerRequest, TProjectIssuesSearchParams } from "@plane/types";
import { Button, EModalPosition, EModalWidth, Input, setToast, TOAST_TYPE, ModalCore } from "@plane/ui";
import { getDescriptionPlaceholderI18n } from "@plane/utils";
// components
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
import { RichTextEditor } from "@/components/editor/rich-text";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { RequestAttachmentsList, SourceCreateUpdateModal, SourceItem } from "@/plane-web/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";
// plane web services
import { WorkspaceService } from "@/plane-web/services";
// services
import { AddAttachmentButton } from "./attachments/add-attachment-btn";

type TProps = {
  workspaceSlug: string;
  customerId: string;
  isOpen: boolean;
  handleClose: () => void;
  data?: TCustomerRequest;
};

const defaultValues = {
  name: "",
  description: "",
};

// services
const workspaceService = new WorkspaceService();

const customerService = new CustomerService();

export const CustomerRequestForm: FC<TProps> = observer((props) => {
  const { isOpen, handleClose, workspaceSlug, customerId, data } = props;
  // states
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [workItemsModal, setWorkItemsModal] = useState<boolean>(false);
  const [selectedWorkItems, setSelectedWorkItems] = useState<ISearchIssueResponse[]>([]);
  const [link, setLink] = useState<string | undefined>();
  // TODO: workspace uploads
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);

  // refs

  // i18n
  const { t } = useTranslation();
  // hooks
  const {
    createCustomerRequest,
    updateCustomerRequest,
    toggleRequestSourceModal,
    workItems: { addWorkItemsToCustomer },
  } = useCustomers();
  const { getWorkspaceBySlug } = useWorkspace();
  const { uploadEditorAsset } = useEditorAsset();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;
  const workItemsCount = useMemo(() => {
    const _count = selectedWorkItems.length;
    if (data) {
      return (data.work_item_ids?.length || 0) + _count;
    } else {
      return _count;
    }
  }, [selectedWorkItems, data]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TCustomerRequest>({
    defaultValues: { ...defaultValues, ...data },
  });

  const workItemSearchCallBack = (params: TProjectIssuesSearchParams) =>
    customerService.workItemsSearch(workspaceSlug, customerId, params);

  const resetData = () => {
    reset(defaultValues);
    setLink(undefined);
    setSelectedWorkItems([]);
  };

  const handleWorkItemsSubmit = async (searchData: ISearchIssueResponse[]) => {
    setSelectedWorkItems(searchData);
  };

  const onAssetUpload = (id: string) => {
    setUploadedAssetIds((prev) => [...prev, id]);
  };

  const onSubmit = async (data: Partial<TCustomerRequest>) => {
    const workItemIds = selectedWorkItems.map((item) => item.id).filter((id) => id !== null);
    // get changed fields
    let payload = {
      ...data,
    };
    // check if link is changed
    if (link !== data?.link) {
      payload = {
        ...payload,
        link,
      };
    }

    const operation = data.id
      ? updateCustomerRequest(workspaceSlug, customerId, data.id, payload)
          .then((response) => {
            captureSuccess({
              eventName: CUSTOMER_TRACKER_EVENTS.update_request,
              payload: {
                id: customerId,
                request_id: data.id,
              },
            });
            return response;
          })
          .catch((error) => {
            captureError({
              eventName: CUSTOMER_TRACKER_EVENTS.update_request,
              payload: {
                id: customerId,
                request_id: data.id,
              },
              error: error as Error,
            });
          })
      : createCustomerRequest(workspaceSlug, customerId, payload)
          .then((response) => {
            captureSuccess({
              eventName: CUSTOMER_TRACKER_EVENTS.create_request,
              payload: {
                id: customerId,
              },
            });
            return response;
          })
          .catch((error) => {
            captureError({
              eventName: CUSTOMER_TRACKER_EVENTS.create_request,
              payload: {
                id: customerId,
              },
              error: error as Error,
            });
          });
    setSubmitting(true);
    try {
      const response = await operation;
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: data.id
          ? t("customers.requests.toasts.update.success.title")
          : t("customers.requests.toasts.create.success.title"),
        message: data.id
          ? t("customers.requests.toasts.update.success.message")
          : t("customers.requests.toasts.create.success.message"),
      });
      if (response?.id && workItemIds.length) {
        await addWorkItemsToCustomer(workspaceSlug, customerId, workItemIds, response.id)
          .then(() => {
            captureSuccess({
              eventName: CUSTOMER_TRACKER_EVENTS.add_work_items_to_customer,
              payload: {
                id: customerId,
                request_id: response.id,
                work_item_ids: workItemIds,
              },
            });
          })
          .catch((error: any) => {
            captureError({
              eventName: CUSTOMER_TRACKER_EVENTS.add_work_items_to_customer,
              payload: {
                id: customerId,
                request_id: response.id,
              },
              error: error as Error,
            });
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("customers.requests.toasts.work_item.add.error.title"),
              message: error.error || t("customers.requests.toasts.work_item.add.error.message"),
            });
          });
      }
      resetData();
      handleClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: data.id
          ? t("customers.requests.toasts.update.error.title")
          : t("customers.requests.toasts.create.error.title"),
        message:
          error?.error || data.id
            ? t("customers.requests.toasts.update.error.message")
            : t("customers.requests.toasts.create.error.message"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (data?.link) setLink(data.link);
  }, [data]);

  if (!isOpen) return null;

  return (
    <>
      {/* Request Modal */}
      <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXXL}>
        <ExistingIssuesListModal
          workspaceSlug={workspaceSlug}
          isOpen={workItemsModal}
          handleClose={() => setWorkItemsModal(false)}
          searchParams={{}}
          handleOnSubmit={handleWorkItemsSubmit}
          selectedWorkItems={selectedWorkItems}
          workItemSearchServiceCallback={workItemSearchCallBack}
        />
        <SourceCreateUpdateModal id={customerId} setLinkData={setLink} preloadedData={{ url: link }} />
        <div className="p-4">
          <h3 className="text-xl font-medium text-custom-text-200">
            {data?.id ? t("customers.requests.update") : t("customers.requests.add")}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* overflow-y-auto vertical-scrollbar scrollbar-sm */}
            <div className="py-2">
              <div className="space-y-2">
                <div>
                  <Controller
                    name="name"
                    control={control}
                    rules={{
                      required: {
                        value: true,
                        message: t("customers.requests.form.name.validation.required"),
                      },
                      maxLength: {
                        value: 255,
                        message: t("customers.requests.form.name.validation.max_length"),
                      },
                    }}
                    render={({ field: { value, onChange } }) => (
                      <Input
                        value={value}
                        onChange={onChange}
                        hasError={Boolean(errors.name)}
                        placeholder={t("customers.requests.form.name.placeholder")}
                        className={"w-full text-base"}
                      />
                    )}
                  />
                  <span className="text-xs text-red-500">{errors?.name?.message}</span>
                </div>
                <Controller
                  name="description_html"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <RichTextEditor
                      editable
                      id="customer-modal-editor"
                      initialValue={value ?? ""}
                      workspaceSlug={workspaceSlug}
                      workspaceId={workspaceId}
                      onChange={(_description: object, description_html: string) => {
                        onChange(description_html);
                      }}
                      disabledExtensions={["attachments"]}
                      displayConfig={{ fontSize: "small-font" }}
                      placeholder={(isFocused, description) => t(getDescriptionPlaceholderI18n(isFocused, description))}
                      searchMentionCallback={async (payload) =>
                        await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
                          ...payload,
                        })
                      }
                      containerClassName="pt-3 min-h-[150px] rounded-lg relative border border-custom-border-100"
                      uploadFile={async (blockId, file) => {
                        try {
                          const { asset_id } = await uploadEditorAsset({
                            blockId,
                            data: {
                              entity_identifier: data?.id ?? "",
                              entity_type: EFileAssetType.CUSTOMER_REQUEST_DESCRIPTION,
                            },
                            file,
                            workspaceSlug,
                          });
                          onAssetUpload?.(asset_id);
                          return asset_id;
                        } catch (error) {
                          throw new Error("Asset upload failed. Please try again later.");
                        }
                      }}
                    />
                  )}
                />
              </div>
              {/* Attachments List */}
              <div className="my-3">
                {data?.id && (
                  <RequestAttachmentsList workspaceSlug={workspaceSlug} requestId={data?.id} customerId={customerId} />
                )}
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <Button
                  variant="neutral-primary"
                  size="sm"
                  className="text-custom-text-200 bg-custom-background-100 text-sm"
                  onClick={() => toggleRequestSourceModal(customerId)}
                >
                  {link ? (
                    <SourceItem link={link} />
                  ) : (
                    <>
                      <Database className="size-3" /> {t("customers.requests.form.source.add")}
                    </>
                  )}
                </Button>
                <Button
                  variant="neutral-primary"
                  size="sm"
                  className="text-custom-text-200 text-sm"
                  onClick={() => setWorkItemsModal(true)}
                >
                  <LayersIcon className="size-3" />
                  {workItemsCount > 0 ? (
                    <span className="text-sm">{workItemsCount}</span>
                  ) : (
                    t("customers.linked_work_items.link")
                  )}
                </Button>
              </div>
            </div>
            <div className="border-t border-custom-border-200 flex justify-between items-center p-3">
              <div>
                {data?.id && (
                  <AddAttachmentButton
                    customerId={customerId}
                    requestId={data.id}
                    workspaceSlug={workspaceSlug}
                    disabled={false}
                  >
                    <Paperclip className="size-3" />
                  </AddAttachmentButton>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="neutral-primary"
                  size="sm"
                  onClick={() => {
                    resetData();
                    handleClose();
                  }}
                >
                  {t("customers.create.cancel")}
                </Button>
                <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} size="sm">
                  {isSubmitting
                    ? data?.id
                      ? t("customers.update.loading")
                      : t("customers.create.loading")
                    : data?.id
                      ? t("customers.requests.update")
                      : t("customers.requests.create")}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </ModalCore>
    </>
  );
});
