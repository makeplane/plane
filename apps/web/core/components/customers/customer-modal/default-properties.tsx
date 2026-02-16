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

import type { FC } from "react";
import React, { useEffect, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
// plane constants
import {
  CUSTOMER_CONTRACT_STATUS,
  CUSTOMER_STAGES,
  CUSTOMER_WEBSITE_AND_SOURCE_URL_REGEX,
  ETabIndices,
} from "@plane/constants";
// plane i18n
import { useTranslation } from "@plane/i18n";
// plane types
import { CustomersIcon, EditIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TCustomerPayload } from "@plane/types";
import { EFileAssetType } from "@plane/types";
import { CustomSearchSelect, Input } from "@plane/ui";
// utils
import { getDescriptionPlaceholderI18n, getFileURL, getTabIndex } from "@plane/utils";
import { RichTextEditor } from "@/components/editor/rich-text";
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web services
import { WorkspaceService } from "@/services/workspace.service";
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

export function DefaultProperties(props: Props) {
  const { workspaceSlug, submitBtnRef, customerId, onAssetUpload } = props;
  //states
  const [logo, setLogo] = useState<File | null>(null);
  const [logoBlobUrl, setLogoBlobUrl] = useState<string | null>(null);
  // Memoize the blob URL and revoke on cleanup to prevent memory leaks
  useEffect(() => {
    if (logo) {
      const url = URL.createObjectURL(logo);
      setLogoBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setLogoBlobUrl(null);
  }, [logo]);
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
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  const { currentWorkspace } = useWorkspace();

  // refs
  const logoInputRef = useRef<HTMLInputElement>(null);

  const customerStageOptions = CUSTOMER_STAGES.map((stage) => ({
    value: stage.value,
    query: t(stage.i18n_name),
    content: <div className="text-13">{t(stage.i18n_name)}</div>,
  }));

  const customerContractStatusOptions = CUSTOMER_CONTRACT_STATUS.map((stage) => ({
    value: stage.value,
    query: t(stage.i18n_name),
    content: (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
        <p className="text-13">{t(stage.i18n_name)}</p>
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
          className="absolute -right-2 -top-1 p-1.5 rounded-full bg-surface-1 border border-subtle-1 cursor-pointer"
          onClick={handleOpenImagePicker}
        >
          <EditIcon className="size-2.5" />
        </div>
        <Controller
          name="logo_url"
          control={control}
          render={({ field: { value, onChange } }) => (
            <>
              {value || logo ? (
                <div className="bg-surface-1 rounded-md h-11 w-11 overflow-hidden border-[0.5px] border-subtle-1">
                  <img
                    src={logoBlobUrl ?? (value && value !== "" ? (getFileURL(value) ?? "") : "")}
                    alt="customer logo"
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              ) : (
                <div className="bg-layer-1 rounded-md flex items-center justify-center h-11 w-11 p-1.5">
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
          <label htmlFor="name" className="text-13">
            {t("customers.properties.default.customer_name.name")} <span className="text-danger-primary">*</span>
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
          <span className="text-11 text-danger-primary">{errors?.name?.message}</span>
        </div>
        <div className="space-y-1">
          <label htmlFor="email" className="text-13">
            {t("customers.properties.default.email.name")} <span className="text-danger-primary">*</span>
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
          <span className="text-11 text-danger-primary">{errors.email?.message}</span>
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="description_html" className="text-13">
          {t("customers.properties.default.description.name")}
        </label>
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
              tabIndex={getIndex("description_html")}
              onEnterKeyPress={() => submitBtnRef?.current?.click()}
              placeholder={(isFocused, description) => t(getDescriptionPlaceholderI18n(isFocused, description))}
              searchMentionCallback={async (payload) =>
                await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
                  ...payload,
                })
              }
              containerClassName="pt-3 min-h-[120px] border-[0.5px] border-subtle-1 rounded-lg relative focus:ring-1 focus:ring-accent-strong"
              disabledExtensions={["attachments"]}
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
              duplicateFile={async (assetId: string) => {
                try {
                  const { asset_id } = await duplicateEditorAsset({
                    assetId,
                    entityId: customerId,
                    entityType: EFileAssetType.CUSTOMER_DESCRIPTION,
                    workspaceSlug,
                  });
                  onAssetUpload?.(asset_id);
                  return asset_id;
                } catch (error) {
                  throw new Error("Asset duplication failed. Please try again later.");
                }
              }}
            />
          )}
        />
        <span className="text-11 text-danger-primary">{errors.description_html?.message}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div className="space-y-1">
          <label htmlFor="website" className="text-13">
            {t("customers.properties.default.website_url.name")}
          </label>
          <Controller
            name="website_url"
            control={control}
            rules={{
              pattern: {
                value: CUSTOMER_WEBSITE_AND_SOURCE_URL_REGEX,
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
          <span className="text-11 text-danger-primary">{errors.website_url?.message}</span>
        </div>
        <div className="space-y-1">
          <label htmlFor="domain" className="text-13">
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
          <span className="text-11 text-danger-primary">{errors.domain?.message}</span>
        </div>
        <div className="space-y-1">
          <label htmlFor="employees" className="text-13">
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
          <span className="text-11 text-danger-primary">{errors.employees?.message}</span>
        </div>
        <div className="space-y-1">
          <label htmlFor="stage" className="text-13">
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
                    <span className="text-13 text-secondary">
                      {customerStageOptions.find((stage) => stage.value === value)?.query || (
                        <span className="text-placeholder">{t("customers.properties.default.stage.placeholder")}</span>
                      )}
                    </span>
                  </div>
                }
                value={value}
                onChange={onChange}
                maxHeight="lg"
                buttonClassName="w-full py-2 px-3 rounded-md border-[0.5px] border-subtle-1 focus:outline-none"
                tabIndex={getIndex("stage")}
              />
            )}
          />
          <span className="text-11 text-danger-primary">{errors.stage?.message}</span>
        </div>
        <div className="space-y-1">
          <label htmlFor="contract_status" className="text-13">
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
                      <span className="text-13 text-secondary">
                        {labelContent ? (
                          labelContent.content
                        ) : (
                          <span className="text-placeholder">
                            {t("customers.properties.default.contract_status.placeholder")}
                          </span>
                        )}
                      </span>
                    </div>
                  }
                  value={value}
                  onChange={onChange}
                  maxHeight="lg"
                  buttonClassName="w-full py-2 px-3 rounded-md border-[0.5px] border-subtle-1 focus:outline-none"
                  tabIndex={getIndex("contract_status")}
                />
              );
            }}
          />
          <span className="text-11 text-danger-primary">{errors.contract_status?.message}</span>
        </div>
        <div className="space-y-1">
          <label htmlFor="revenue" className="text-13">
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
          <span className="text-11 text-danger-primary">{errors.revenue?.message}</span>
        </div>
      </div>
    </>
  );
}
