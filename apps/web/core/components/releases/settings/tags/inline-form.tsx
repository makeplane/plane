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

import { useEffect } from "react";
import { observer } from "mobx-react";
import type { SubmitHandler } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { ReleaseTag, ReleaseTagWrite } from "@plane/types";
import { Input } from "@plane/ui";

export type ReleaseTagOperationsCallbacks = {
  createTag: (data: ReleaseTagWrite) => Promise<ReleaseTag | undefined>;
  updateTag: (tagId: string, data: Partial<ReleaseTagWrite>) => Promise<ReleaseTag | undefined>;
};

type Props = {
  isUpdating: boolean;
  tagOperationsCallbacks: ReleaseTagOperationsCallbacks;
  tagToUpdate?: ReleaseTag;
  onClose?: () => void;
};

const defaultValues: ReleaseTagWrite = { version: "" };

export const CreateUpdateReleaseTagInline = observer(function CreateUpdateReleaseTagInline(props: Props) {
  const { isUpdating, tagOperationsCallbacks, tagToUpdate, onClose } = props;
  const { t } = useTranslation();

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    setFocus,
  } = useForm<ReleaseTagWrite>({ defaultValues });

  const handleClose = () => {
    reset(defaultValues);
    onClose?.();
  };

  const handleCreate: SubmitHandler<ReleaseTagWrite> = async (formData) => {
    if (isSubmitting) return;
    await tagOperationsCallbacks
      .createTag(formData)
      .then(() => {
        handleClose();
        reset(defaultValues);
        return;
      })
      .catch(() => reset(formData));
  };

  const handleUpdate: SubmitHandler<ReleaseTagWrite> = async (formData) => {
    if (!tagToUpdate?.id || isSubmitting) return;
    await tagOperationsCallbacks
      .updateTag(tagToUpdate.id, formData)
      .then(() => {
        reset(defaultValues);
        handleClose();
        return;
      })
      .catch(() => reset(formData));
  };

  const handleFormSubmit = async (formData: ReleaseTagWrite) => {
    if (isUpdating) {
      await handleUpdate(formData);
    } else {
      await handleCreate(formData);
    }
  };

  useEffect(() => {
    setValue("version", tagToUpdate?.version ?? "");
    setFocus("version");
  }, [tagToUpdate, setValue, setFocus]);

  return (
    <>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="flex w-full scroll-m-8 items-center gap-2 bg-surface-1 px-3 py-2 rounded-lg"
      >
        <div className="flex flex-1 flex-col justify-center">
          <Controller
            control={control}
            name="version"
            rules={{ required: t("releases.settings.tags.errors.version_required") }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="releaseTagVersion"
                name="version"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.version)}
                placeholder="v1.0.0"
                className="w-full font-mono h-8"
              />
            )}
          />
        </div>

        <Button variant="secondary" onClick={handleClose} size={"xl"}>
          {t("cancel")}
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting} size={"xl"}>
          {isUpdating ? (isSubmitting ? t("updating") : t("update")) : isSubmitting ? t("adding") : t("add")}
        </Button>
      </form>
      {errors.version?.message && <p className="p-0.5 pl-3 text-13 text-danger-primary">{errors.version.message}</p>}
    </>
  );
});
