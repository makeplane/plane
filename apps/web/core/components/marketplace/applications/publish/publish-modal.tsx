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

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { Button } from "@plane/propel/button";
import type { TApplicationPublishDetails, TUserApplication } from "@plane/types";
import { Input, ModalCore } from "@plane/ui";

// form to publish app

type ApplicationPublishModalProps = {
  isOpen: boolean;
  handleClose: () => void;
  app: TUserApplication;
};

const defaultFormData: TApplicationPublishDetails = {
  description_html: "",
  category: "",
  supported_languages: "",
  contact_email: "",
  privacy_policy_tnc_url: "",
  document_urls: "",
  photo_urls: "",
};

export const ApplicationPublishModal = observer(function ApplicationPublishModal(props: ApplicationPublishModalProps) {
  const { isOpen, handleClose, app } = props;
  // states
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [publishError, setPublishError] = React.useState<string | null>(null);

  // form
  const {
    watch,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<TApplicationPublishDetails>({
    defaultValues: defaultFormData,
  });

  const handleTextChange = (key: keyof TApplicationPublishDetails, value: string) => {
    setValue(key, value, { shouldValidate: true });
  };

  const handleAppPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Something went wrong. Please try again later.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose}>
      <form onSubmit={handleAppPublish}>
        <div className="space-y-3 p-5 pb-4">
          <h3 className="text-18 font-medium text-secondary">Publish your integration to Marketplace</h3>
          <div>
            <Input
              id="name"
              type="text"
              placeholder="What will you call this app"
              className="w-full resize-none text-13"
              hasError={Boolean(errors.contact_email)}
              tabIndex={1}
              {...register("contact_email", { required: "Contact email is required" })}
              onChange={(e) => handleTextChange("contact_email", e.target.value)}
            />
            {errors.contact_email && <p className="text-danger-primary text-11">{errors.contact_email.message}</p>}
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <div className="flex items-center space-x-2">
            <Button variant="secondary" className="bg-surface-1">
              Cancel
            </Button>
            <Button variant="primary">Next</Button>
          </div>
        </div>
      </form>
    </ModalCore>
  );
});
