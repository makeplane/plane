import { FC, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
// plane imports
import { ETabIndices } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TCustomer, TCustomerPayload } from "@plane/types";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { cn, getTabIndex } from "@plane/utils";
// store
import { useCommandPalette } from "@/hooks/store";
// plane web components
import { CustomerAdditionalProperties, DefaultProperties } from "@/plane-web/components/customers";
import { getChangedCustomerFields } from "@/plane-web/helpers/customers.helper";
import { useCustomerModal } from "@/plane-web/hooks/context/use-customer-modal";
import { useCustomers } from "@/plane-web/hooks/store";
import { CreateCustomerCreateToastActions } from "./customer-create-toast-actions";

const defaultValues: Partial<TCustomer> = {
  name: "",
  description_html: "",
  description: {},
  email: "",
  website_url: "",
  logo_url: "",
  domain: "",
  employees: undefined,
  stage: undefined,
  contract_status: undefined,
  revenue: undefined,
};
type TCustomerForms = {
  data?: Partial<TCustomer>;
  handleModalClose: () => void;
};

export const CustomerForm: FC<TCustomerForms> = (props) => {
  const { data, handleModalClose } = props;
  // params
  const { workspaceSlug } = useParams();
  // states
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [isFormOverFlowing, setFormOverflow] = useState<boolean>(false);
  // i18n
  const { t } = useTranslation();
  // hooks
  const { getIndex } = getTabIndex(ETabIndices.CUSTOMER_FORM);
  const { createCustomer, updateCustomer } = useCustomers();
  const { toggleCreateCustomerModal } = useCommandPalette();
  const { handlePropertyValuesValidation, handleCreateUpdatePropertyValues } = useCustomerModal();
  // refs
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);

  const methods = useForm<TCustomer>({
    defaultValues: { ...defaultValues, ...data },
    reValidateMode: "onChange",
  });
  const {
    handleSubmit,
    formState: { dirtyFields },
  } = methods;

  const handleCreateCustomer = async (data: Partial<TCustomerPayload>) => {
    try {
      const customer = await createCustomer(workspaceSlug.toString(), data);

      // add additional property values
      if (customer.id) {
        await handleCreateUpdatePropertyValues({
          workspaceSlug: workspaceSlug.toString(),
          customerId: customer.id,
        });
      }

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("customers.toasts.create.success.title", { customer_name: customer.name }),
        message: t("customers.toasts.create.success.message"),
        actionItems: customer.id && (
          <CreateCustomerCreateToastActions workspaceSlug={workspaceSlug.toString()} customerId={customer.id} />
        ),
      });
      toggleCreateCustomerModal();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("customers.toasts.create.error.title"),
        message: error.error || t("customers.toasts.create.error.message"),
      });
    }
  };
  const handleUpdateCustomer = async (data: Partial<TCustomer>) => {
    if (!data.id) return;
    try {
      const customer = await updateCustomer(workspaceSlug.toString(), data.id, data);

      // add additional property values
      if (customer.id) {
        await handleCreateUpdatePropertyValues({
          workspaceSlug: workspaceSlug.toString(),
          customerId: customer.id,
        });
      }

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("customers.toasts.update.success.title"),
        message: t("customers.toasts.update.success.message"),
      });

      toggleCreateCustomerModal();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("customers.toasts.update.error.title"),
        message: error.error || t("customers.toasts.update.error.message"),
      });
    }
  };

  /** To show shadow in the bottom bar when element has scroll */
  useEffect(() => {
    if (formContainerRef.current?.scrollHeight) {
      const hasOverflown = formContainerRef.current.offsetHeight < formContainerRef.current.scrollHeight;
      setFormOverflow(hasOverflown);
    }
  }, [formContainerRef.current?.scrollHeight]);

  const onSubmit = async (formData: TCustomer) => {
    if (!workspaceSlug) return;
    const parsedUrl = formData.website_url
      ? formData.website_url?.startsWith("http")
        ? formData.website_url
        : `http://${formData.website_url}`
      : "";

    const payload = { ...formData, website_url: parsedUrl };

    // validate custom properties
    if (!handlePropertyValuesValidation()) return;

    setSubmitting(true);
    const submitData: Partial<TCustomer> = !data?.id
      ? payload
      : {
          ...getChangedCustomerFields(payload, dirtyFields as { [key: string]: boolean | undefined }),
          id: data.id,
          description_html: payload.description_html ?? "<p></p>",
        };

    if (!data?.id) await handleCreateCustomer(submitData);
    await handleUpdateCustomer(submitData);

    setSubmitting(false);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg">
        <div className="space-y-2 pl-5 pt-5">
          <h3 className="text-xl font-medium text-custom-text-200">
            {data?.id ? t("customers.update.label") : t("customers.create.label")}
          </h3>
          {/* Default Properties */}
          <div
            className="max-h-[72vh] overflow-x-hidden overflow-y-auto py-2 vertical-scrollbar scrollbar-sm space-y-2 pr-5"
            ref={formContainerRef}
          >
            <DefaultProperties
              workspaceSlug={workspaceSlug.toString()}
              submitBtnRef={submitBtnRef}
              customerId={data?.id}
            />
            {/* Customer Additional Properties */}
            <CustomerAdditionalProperties workspaceSlug={workspaceSlug.toString()} customerId={data?.id} />
          </div>
        </div>
        <div
          className={cn(
            "px-5 py-3 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-100",
            isFormOverFlowing && "shadow-custom-shadow-xs"
          )}
        >
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="neutral-primary"
              size="sm"
              onClick={handleModalClose}
              tabIndex={getIndex("cancel")}
            >
              {t("customers.create.cancel")}
            </Button>
            <Button
              variant="primary"
              ref={submitBtnRef}
              size="sm"
              type="submit"
              tabIndex={getIndex("submit")}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? data?.id
                  ? t("customers.update.loading")
                  : t("customers.create.loading")
                : data?.id
                  ? t("customers.update.label")
                  : t("customers.create.label")}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
