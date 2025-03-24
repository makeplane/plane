import React, { FC, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { PencilIcon } from "lucide-react";
// plane constants
import { CUSTOMER_CONTRACT_STATUS, CUSTOMER_STAGES, ETabIndices } from "@plane/constants";
// plane i18n
import { useTranslation } from "@plane/i18n";
// plane types
import { TCustomerPayload } from "@plane/types";
// plane ui
import { EFileAssetType } from "@plane/types/src/enums";
import { CustomersIcon, CustomSearchSelect, Input, setToast, TOAST_TYPE } from "@plane/ui";
// utils
import { getFileURL } from "@plane/utils";
import { RichTextEditor } from "@/components/editor";
// helpers
import { getDescriptionPlaceholderI18n } from "@/helpers/issue.helper";
import { getTabIndex } from "@/helpers/tab-indices.helper";
import { useEditorAsset, useWorkspace } from "@/hooks/store";
// plane web services
import { WorkspaceService } from "@/plane-web/services";
// services
import { FileService } from "@/services/file.service";

// services
const workspaceService = new WorkspaceService();
const fileService = new FileService();

type Props = {
  workspaceSlug: string;
  submitBtnRef: React.MutableRefObject<HTMLButtonElement | null>;
  customerId: string | undefined;
  onAssetUpload?: (assetId: string) => void;
};

export const DefaultProperties: FC<Props> = (props) => {
  const { workspaceSlug, submitBtnRef, customerId, onAssetUpload } = props;
  //states
  const [logo, setLogo] = useState<File | null>(null);
  // i18n
  const { t } = useTranslation();
  // hooks
  const {
    formState: { errors },
    control,
    setValue,
  } = useFormContext<TCustomerPayload>();
  const { getIndex } = getTabIndex(ETabIndices.CUSTOMER_FORM);
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;
  const { uploadEditorAsset } = useEditorAsset();
  const { currentWorkspace } = useWorkspace();

  // refs
  const logoInputRef = useRef<HTMLInputElement>(null);

  const customerStageOptions = CUSTOMER_STAGES.map((stage) => ({
    value: stage.value,
    query: t(stage.i18n_name),
    content: <div className="text-sm">{t(stage.i18n_name)}</div>,
  }));

  const customerContractStatusOptions = CUSTOMER_CONTRACT_STATUS.map((stage) => ({
    value: stage.value,
    query: t(stage.i18n_name),
    content: (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
        <p className="text-sm">{t(stage.i18n_name)}</p>
      </div>
    ),
  }));

  const onLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || !currentWorkspace || !workspaceSlug) return;
    const image = fileList[0];
    setLogo(image);
    try {
      const { asset_id } = await fileService.uploadWorkspaceAsset(
        workspaceSlug.toString(),
        {
          entity_identifier: currentWorkspace.id,
          entity_type: EFileAssetType.CUSTOMER_LOGO,
        },
        image
      );
      if (asset_id) {
        setValue("logo_asset", asset_id, { shouldDirty: true });
      }
    } catch (error: any) {
      setLogo(null);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toasts.logo.error.title"),
        message: error?.error || error?.message || t("toasts.logo.error.message"),
      });
    }
  };

  const handleOpenImagePicker = () => {
    logoInputRef.current?.click();
  };

  return (
    <>
      <div className="py-2 w-fit relative space-y-1">
        <div
          className="absolute -right-2 -top-1 p-1.5 rounded-full bg-custom-background-100 border border-custom-border-300 cursor-pointer"
          onClick={handleOpenImagePicker}
        >
          <PencilIcon className="size-2.5" />
        </div>
        <Controller
          name="logo_url"
          control={control}
          render={({ field: { value, onChange } }) => (
            <>
              {value || logo ? (
                <div className="bg-custom-background-100 rounded-md h-11 w-11 overflow-hidden border-[0.5px] border-custom-border-300">
                  <img
                    src={logo ? URL.createObjectURL(logo) : value && value !== "" ? (getFileURL(value) ?? "") : ""}
                    alt="customer logo"
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              ) : (
                <div className="bg-custom-background-90 rounded-md flex items-center justify-center h-11 w-11 p-1.5">
                  <CustomersIcon className="size-5 opacity-50" />
                </div>
              )}
              <Input
                type="file"
                ref={logoInputRef}
                accept="image/jpeg, image/png, image/jpg, image/webp"
                className="hidden"
                maxLength={1}
                onChange={(event) => onLogoUpload(event)}
              />
            </>
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 space-y-1">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm">
            {t("customers.properties.default.customer_name.name")} <span className="text-red-500">*</span>
          </label>
          <Controller
            name="name"
            control={control}
            rules={{
              required: t("customers.properties.default.customer_name.validation.required"),
              maxLength: {
                value: 255,
                message: t("customers.properties.default.customer_name.validation.max_length"),
              },
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="name"
                name="name"
                type="text"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.name)}
                placeholder={t("customers.properties.default.customer_name.placeholder")}
                className="w-full focus:border-blue-400"
                autoFocus
                tabIndex={getIndex("name")}
              />
            )}
          />
          <span className="text-xs text-red-500">{errors?.name?.message}</span>
        </div>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm">
            {t("customers.properties.default.email.name")} <span className="text-red-500">*</span>
          </label>
          <Controller
            name="email"
            control={control}
            rules={{
              required: t("customers.properties.default.email.validation.required"),
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: t("customers.properties.default.email.validation.pattern"),
              },
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="email"
                name="email"
                type="text"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.email)}
                placeholder={t("customers.properties.default.email.placeholder")}
                className="w-full focus:border-blue-400"
                tabIndex={getIndex("email")}
              />
            )}
          />
          <span className="text-xs text-red-500">{errors.email?.message}</span>
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="description_html" className="text-sm">
          {t("customers.properties.default.description.name")}
        </label>
        <Controller
          name="description_html"
          control={control}
          render={({ field: { value, onChange } }) => (
            <RichTextEditor
              id="customer-modal-editor"
              initialValue={value ?? ""}
              workspaceSlug={workspaceSlug}
              workspaceId={workspaceId}
              onChange={(_description: object, description_html: string) => {
                onChange(description_html);
              }}
              tabIndex={getIndex("description_html")}
              onEnterKeyPress={() => submitBtnRef?.current?.click()}
              placeholder={(isFocused, description) => t(getDescriptionPlaceholderI18n(isFocused, description))}
              searchMentionCallback={async (payload) =>
                await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
                  ...payload,
                })
              }
              containerClassName="pt-3 min-h-[120px] border-[0.5px] border-custom-border-200 rounded-lg relative focus:ring-1 focus:ring-custom-primary"
              uploadFile={async (blockId, file) => {
                try {
                  const { asset_id } = await uploadEditorAsset({
                    blockId,
                    data: {
                      entity_identifier: customerId ?? "",
                      entity_type: EFileAssetType.CUSTOMER_DESCRIPTION,
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
        <span className="text-xs text-red-500">{errors.description_html?.message}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div className="space-y-1">
          <label htmlFor="website" className="text-sm">
            {t("customers.properties.default.website_url.name")}
          </label>
          <Controller
            name="website_url"
            control={control}
            rules={{
              pattern: {
                value:
                  /^(https?:\/\/)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
                message: t("customers.properties.default.website_url.validation.pattern"),
              },
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="website_url"
                name="website_url"
                type="text"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.website_url)}
                placeholder={t("customers.properties.default.website_url.placeholder")}
                className="w-full focus:border-blue-400"
                tabIndex={getIndex("website_url")}
              />
            )}
          />
          <span className="text-xs text-red-500">{errors.website_url?.message}</span>
        </div>
        <div className="space-y-1">
          <label htmlFor="domain" className="text-sm">
            {t("customers.properties.default.domain.name")}
          </label>
          <Controller
            name="domain"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Input
                id="domain"
                name="domain"
                type="text"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.domain)}
                placeholder={t("customers.properties.default.domain.placeholder")}
                className="w-full focus:border-blue-400"
                tabIndex={getIndex("domain")}
              />
            )}
          />
          <span className="text-xs text-red-500">{errors.domain?.message}</span>
        </div>
        <div className="space-y-1">
          <label htmlFor="employees" className="text-sm">
            {t("customers.properties.default.employees.name")}
          </label>
          <Controller
            name="employees"
            control={control}
            rules={{
              min: {
                value: 0,
                message: t("customers.properties.default.employees.validation.min_length"),
              },
              max: {
                value: 2147483647,
                message: t("customers.properties.default.employees.validation.max_length"),
              },
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="name"
                name="employees"
                type="number"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.employees)}
                placeholder={t("customers.properties.default.employees.placeholder")}
                className="w-full focus:border-blue-400"
                tabIndex={getIndex("employees")}
              />
            )}
          />
          <span className="text-xs text-red-500">{errors.employees?.message}</span>
        </div>
        <div className="space-y-1">
          <label htmlFor="stage" className="text-sm">
            {t("customers.properties.default.stage.name")}
          </label>
          <Controller
            name="stage"
            control={control}
            render={({ field: { value, onChange } }) => (
              <CustomSearchSelect
                options={customerStageOptions}
                label={
                  <div className="truncate">
                    <span className="text-sm text-custom-text-200">
                      {customerStageOptions.find((stage) => stage.value === value)?.query || (
                        <span className="text-custom-text-400">
                          {t("customers.properties.default.stage.placeholder")}
                        </span>
                      )}
                    </span>
                  </div>
                }
                value={value}
                onChange={onChange}
                maxHeight="lg"
                buttonClassName="w-full py-2 px-3 rounded-md border-[0.5px] border-custom-border-200 focus:outline-none"
                tabIndex={getIndex("stage")}
              />
            )}
          />
          <span className="text-xs text-red-500">{errors.stage?.message}</span>
        </div>
        <div className="space-y-1">
          <label htmlFor="contract_status" className="text-sm">
            {t("customers.properties.default.contract_status.name")}
          </label>
          <Controller
            name="contract_status"
            control={control}
            render={({ field: { value, onChange } }) => {
              const labelContent = customerContractStatusOptions.find((status) => status.value === value);
              return (
                <CustomSearchSelect
                  options={customerContractStatusOptions}
                  label={
                    <div className="truncate">
                      <span className="text-sm text-custom-text-200">
                        {labelContent ? (
                          labelContent.content
                        ) : (
                          <span className="text-custom-text-400">
                            {t("customers.properties.default.contract_status.placeholder")}
                          </span>
                        )}
                      </span>
                    </div>
                  }
                  value={value}
                  onChange={onChange}
                  maxHeight="lg"
                  buttonClassName="w-full py-2 px-3 rounded-md border-[0.5px] border-custom-border-200 focus:outline-none"
                  tabIndex={getIndex("contract_status")}
                />
              );
            }}
          />
          <span className="text-xs text-red-500">{errors.contract_status?.message}</span>
        </div>
        <div className="space-y-1">
          <label htmlFor="revenue" className="text-sm">
            {t("customers.properties.default.revenue.name")}
          </label>
          <Controller
            name="revenue"
            control={control}
            rules={{
              min: {
                value: 0,
                message: t("customers.properties.default.revenue.validation.min_length"),
              },
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="name"
                name="revenue"
                type="number"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.revenue)}
                placeholder={t("customers.properties.default.revenue.placeholder")}
                className="w-full focus:border-blue-400"
                tabIndex={getIndex("revenue")}
              />
            )}
          />
          <span className="text-xs text-red-500">{errors.revenue?.message}</span>
        </div>
      </div>
    </>
  );
};
