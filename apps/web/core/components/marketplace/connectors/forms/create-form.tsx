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

import { observer } from "mobx-react";
import { Input, cn } from "@plane/ui";
import { Controller, useFormContext } from "react-hook-form";
import { RadioInput } from "@/components/estimates/radio-select";
import { Button } from "@plane/propel/button";
import type { TConnectorFormData, TConnector } from "@plane/types";
import { useConnectors } from "@/plane-web/hooks/store/marketplace/use-connectors";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { getAssetIdFromUrl } from "@plane/utils";
import { LogoField } from "./logo-field";

type CreateConnectorFormProps = {
  workspaceSlug: string;
  isMetadataEditable?: boolean;
  preloadData?: TConnector;
  handleClose: () => void;
};

const AUTH_TYPE_OPTIONS = [
  { label: "None", value: "none" },
  { label: "OAuth", value: "oauth" },
  { label: "Headers", value: "header" },
];
export const CreateConnectorForm = observer(function CreateConnectorForm(props: CreateConnectorFormProps) {
  const { workspaceSlug, isMetadataEditable = true, preloadData, handleClose } = props;
  const { createConnector, updateConnector, updateConnectorCredentials } = useConnectors();
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useFormContext<TConnectorFormData>();
  const handleFormSubmit = async (data: TConnectorFormData) => {
    try {
      const { headers, ...rest } = data;
      const payload = { ...rest };
      if (payload.logo_url) {
        payload.logo_asset = getAssetIdFromUrl(payload.logo_url);
      }
      if (preloadData) {
        await updateConnector(workspaceSlug, preloadData.id, { ...preloadData, ...payload });
        // Save headers separately via the credentials endpoint
        if (headers?.length) {
          await updateConnectorCredentials(workspaceSlug, preloadData.id, headers);
        }
      } else {
        await createConnector(workspaceSlug, payload);
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Connector created successfully",
        message: "Connector created successfully",
      });
      handleClose();
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error creating connector",
        message: "Error creating connector",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit((data) => handleFormSubmit(data))} className="flex flex-col gap-4">
      <LogoField isMetadataEditable={isMetadataEditable} preloadData={preloadData} />
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-body-xs-medium text-primary">
          Name <sup className="text-danger-primary">*</sup>
        </label>
        <Controller
          control={control}
          name="name"
          rules={{ required: "Name is required" }}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Add name"
              disabled={!isMetadataEditable}
              className={cn("text-primary", {
                "text-tertiary": !isMetadataEditable,
              })}
            />
          )}
        />
        {errors.name && <span className="text-caption-xs-regular text-danger-primary">{errors.name.message}</span>}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-body-xs-medium text-primary">
          Description
        </label>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Add description"
              disabled={!isMetadataEditable}
              className={cn("text-primary", {
                "text-tertiary": !isMetadataEditable,
              })}
            />
          )}
        />
        {errors.description && (
          <span className="text-caption-xs-regular text-danger-primary">{errors.description.message}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="url" className="text-body-xs-medium text-primary">
          MCP remote server URL
          <sup className="text-danger-primary">*</sup>
        </label>
        <Controller
          control={control}
          name="url"
          rules={{
            required: "MCP remote server URL is required",
            pattern: { value: /^https?:\/\//, message: "Invalid URL" },
          }}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="https://mcp.example.so/http/mcp"
              disabled={!isMetadataEditable}
              className={cn("text-primary", {
                "text-tertiary": !isMetadataEditable,
              })}
            />
          )}
        />
        {errors.url && <span className="text-caption-xs-regular text-danger-primary">{errors.url.message}</span>}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="authorization_type" className="text-body-xs-medium text-primary">
          Authentication Type
        </label>
        <Controller
          control={control}
          name="authorization_type"
          rules={{ required: "Authentication Type is required" }}
          render={({ field }) => (
            <RadioInput
              {...field}
              buttonClassName="size-3"
              buttonLabelClassName={cn("text-body-xs-medium text-secondary", {
                "text-tertiary": !isMetadataEditable,
              })}
              options={AUTH_TYPE_OPTIONS.map((option) => ({
                ...option,
                disabled: !isMetadataEditable,
              }))}
              fieldClassName="bg-transparent"
              selected={field.value}
              onChange={field.onChange}
              vertical
            />
          )}
        />
        {errors.authorization_type && (
          <span className="text-caption-xs-regular text-danger-primary">{errors.authorization_type.message}</span>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-subtle pt-4">
        <Button variant="ghost" size="lg" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
          {preloadData ? "Update" : "Add"}
        </Button>
      </div>
    </form>
  );
});
