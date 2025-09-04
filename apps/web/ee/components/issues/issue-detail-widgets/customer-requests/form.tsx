import React, { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { mutate } from "swr";
import { Database, Paperclip } from "lucide-react";
// plane imports
import { CUSTOMER_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EFileAssetType, TCustomerRequest } from "@plane/types";
import { Button, EModalPosition, EModalWidth, Input, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
import { getDescriptionPlaceholderI18n } from "@plane/utils";
import { RichTextEditor } from "@/components/editor/rich-text";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
import useKeypress from "@/hooks/use-keypress";

import {
  AddAttachmentButton,
  CustomerDropDown,
  RequestAttachmentsList,
  SourceCreateUpdateModal,
  SourceItem,
} from "@/plane-web/components/customers";
import { getChangedRequestFields } from "@/plane-web/helpers/customers.helper";
import { useCustomers } from "@/plane-web/hooks/store";
// plane web services
import { WorkspaceService } from "@/plane-web/services";

type TProps = {
  workspaceSlug: string;
  isOpen: boolean;
  handleClose: () => void;
  data?: TCustomerRequest;
  workItemId: string;
};

const defaultValues = {
  name: "",
  description: "",
};

// services
const workspaceService = new WorkspaceService();

export const WorkItemRequestForm: FC<TProps> = observer((props) => {
  const { isOpen, handleClose, workspaceSlug, data, workItemId } = props;
  // states
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [link, setLink] = useState<string | undefined>();
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);

  // refs

  // i18n
  const { t } = useTranslation();
  // hooks
  const {
    createCustomerRequest,
    updateCustomerRequest,
    workItems: { addWorkItemsToCustomer },
    toggleRequestSourceModal,
  } = useCustomers();
  const { getWorkspaceBySlug } = useWorkspace();
  const { uploadEditorAsset } = useEditorAsset();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<TCustomerRequest>({
    defaultValues: { ...defaultValues, ...data },
  });

  const resetData = () => {
    reset(defaultValues);
    setLink(undefined);
  };

  const onAssetUpload = (id: string) => {
    setUploadedAssetIds((prev) => [...prev, id]);
  };

  const onSubmit = async (formData: Partial<TCustomerRequest>) => {
    const customerId = formData?.customer_id;
    // restrict creation of request if customer id is not present
    if (!customerId) return;
    const payload = !data?.id
      ? { ...formData, link }
      : {
          ...getChangedRequestFields(formData, dirtyFields as { [key: string]: boolean | undefined }),
          id: data.id,
          description_html: formData.description_html ?? "<p></p>",
          link,
        };
    const operation = data?.id
      ? updateCustomerRequest(workspaceSlug, customerId, data?.id, payload)
          .then((response) => {
            captureSuccess({
              eventName: CUSTOMER_TRACKER_EVENTS.update_request,
              payload: {
                id: customerId,
              },
            });
            return response;
          })
          .catch((error) => {
            captureError({
              eventName: CUSTOMER_TRACKER_EVENTS.update_request,
              payload: {
                id: customerId,
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
          .catch((error: any) => {
            captureError({
              eventName: CUSTOMER_TRACKER_EVENTS.create_request,
              payload: {
                id: customerId,
                error: error as Error,
              },
            });
          });
    setSubmitting(true);
    try {
      const response = await operation;
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: data?.id
          ? t("customers.requests.toasts.update.success.title")
          : t("customers.requests.toasts.create.success.title"),
        message: data?.id
          ? t("customers.requests.toasts.update.success.message")
          : t("customers.requests.toasts.create.success.message"),
      });
      // add work item to the customer while creating the request
      if (response?.id && !data?.id) {
        await addWorkItemsToCustomer(workspaceSlug, customerId, [workItemId], response.id)
          .then(() => {
            captureSuccess({
              eventName: CUSTOMER_TRACKER_EVENTS.add_work_items_to_customer,
              payload: {
                id: customerId,
                work_item_ids: [workItemId],
              },
            });
          })
          .catch((error) => {
            captureError({
              eventName: CUSTOMER_TRACKER_EVENTS.add_work_items_to_customer,
              payload: {
                id: customerId,
                work_item_ids: [workItemId],
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
      mutate(`WORK_ITEM_CUSTOMERS${workspaceSlug}_${workItemId}`);
      mutate(`WORK_ITEM_REQUESTS${workspaceSlug}_${workItemId}`);
      resetData();
      handleClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: data?.id
          ? t("customers.requests.toasts.update.error.title")
          : t("customers.requests.toasts.create.error.title"),
        message:
          error?.error || data?.id
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

  useKeypress("Escape", () => {
    if (isOpen) handleClose();
  });

  if (!isOpen) return null;

  return (
    <>
      <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXXL}>
        <SourceCreateUpdateModal id={workItemId} setLinkData={setLink} preloadedData={{ url: link }} />
        <div className="p-4">
          <h3 className="text-xl font-medium text-custom-text-200">
            {data?.id ? t("customers.requests.update") : t("customers.requests.add")}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="py-2">
              <div className="space-y-2">
                <div>
                  <div className="w-fit">
                    <Controller
                      name="customer_id"
                      control={control}
                      rules={{
                        required: {
                          value: true,
                          message: t("customers.dropdown.required"),
                        },
                      }}
                      render={({ field: { value, onChange } }) => (
                        <CustomerDropDown value={value} onChange={onChange} disabled={!!data?.id} />
                      )}
                    />
                  </div>
                  <span className="text-xs text-red-500">{errors?.customer_id?.message}</span>
                </div>
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
                <div className="flex gap-2 flex-wrap items-center">
                  <Button
                    variant="neutral-primary"
                    size="sm"
                    className="text-custom-text-200 bg-custom-background-90 text-sm"
                    onClick={() => toggleRequestSourceModal(workItemId)}
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
              </div>
            </div>
            {/* Attachments List */}
            <div className="my-3">
              {data?.id && data?.customer_id && (
                <RequestAttachmentsList
                  workspaceSlug={workspaceSlug}
                  requestId={data?.id}
                  customerId={data?.customer_id}
                />
              )}
            </div>
            <div className="border-t border-custom-border-200 flex justify-between items-center p-3">
              <div>
                {data?.id && data?.customer_id && (
                  <AddAttachmentButton
                    customerId={data?.customer_id}
                    requestId={data?.id}
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
