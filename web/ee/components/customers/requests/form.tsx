import React, { FC, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Database, Paperclip } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CustomerService } from "@plane/services";
import { ISearchIssueResponse, TCustomerRequest, TProjectIssuesSearchParams } from "@plane/types";
import { Button, Input, LayersIcon, setToast, TextArea, TOAST_TYPE } from "@plane/ui";
import { ExistingIssuesListModal } from "@/components/core";
// plane web imports
import { RequestAttachmentsList, SourceCreateUpdateModal, SourceItem } from "@/plane-web/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";
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

const customerService = new CustomerService();

export const CustomerRequestForm: FC<TProps> = observer((props) => {
  const { isOpen, handleClose, workspaceSlug, customerId, data } = props;
  // states
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [linkModal, setLinkModal] = useState<boolean>(false);
  const [workItemsModal, setWorkItemsModal] = useState<boolean>(false);
  const [selectedWorkItems, setSelectedWorkItems] = useState<ISearchIssueResponse[]>([]);
  const [link, setLink] = useState<string | undefined>();

  // i18n
  const { t } = useTranslation();
  // hooks
  const { createCustomerRequest, updateCustomerRequest, addWorkItemsToCustomer } = useCustomers();

  const workItemsCount = useMemo(() => {
    const _count = selectedWorkItems.length;
    if (data) {
      return (data.issue_ids.length || 0) + _count;
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

  const onSubmit = async (data: Partial<TCustomerRequest>) => {
    const workItemIds = selectedWorkItems.map((item) => item.id).filter((id) => id !== null);
    const payload = { ...data, link };
    const operation = data.id
      ? updateCustomerRequest(workspaceSlug, customerId, data.id, payload)
      : createCustomerRequest(workspaceSlug, customerId, { ...payload, issue_ids: workItemIds });
    setSubmitting(true);
    try {
      await operation;
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: data.id
          ? t("customers.requests.toasts.update.success.title")
          : t("customers.requests.toasts.create.success.title"),
        message: data.id
          ? t("customers.requests.toasts.update.success.message")
          : t("customers.requests.toasts.create.success.message"),
      });
      if (data.id && workItemIds.length) {
        await addWorkItemsToCustomer(workspaceSlug, customerId, workItemIds, data.id).catch((error: any) => {
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
          error.error || data.id
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
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        isOpen={workItemsModal}
        handleClose={() => setWorkItemsModal(false)}
        searchParams={{}}
        handleOnSubmit={handleWorkItemsSubmit}
        selectedWorkItems={selectedWorkItems}
        workItemSearchServiceCallback={workItemSearchCallBack}
      />
      <SourceCreateUpdateModal
        isModalOpen={linkModal}
        handleClose={() => setLinkModal(false)}
        setLinkData={setLink}
        preloadedData={{ url: link }}
      />
      <div className="border border-custom-border-100 rounded-md my-3">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-4">
            <Controller
              name="name"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: t("customers.requests.form.name.validation.required"),
                },
              }}
              render={({ field: { value, onChange } }) => (
                <Input
                  value={value}
                  onChange={onChange}
                  hasError={Boolean(errors.name)}
                  placeholder={t("customers.requests.form.name.placeholder")}
                  className={"w-full border-0 text-lg"}
                />
              )}
            />
            <span className="text-xs text-red-500">{errors?.name?.message}</span>
            <Controller
              name="description"
              control={control}
              render={({ field: { value, onChange } }) => (
                <TextArea
                  value={value}
                  onChange={onChange}
                  placeholder={t("customers.requests.form.description.placeholder")}
                  className="w-full border-0 text-base min-h-24"
                />
              )}
            />
            {/* Attachments List */}
            <div className="mb-3">
              {data?.id && (
                <RequestAttachmentsList workspaceSlug={workspaceSlug} requestId={data?.id} customerId={customerId} />
              )}
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <Button
                variant="neutral-primary"
                size="sm"
                className="text-custom-text-200 bg-custom-background-90 text-sm"
                onClick={() => setLinkModal(true)}
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
    </>
  );
});
