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

import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { useOutsideClickDetector } from "@plane/hooks";
import { Button } from "@plane/propel/button";
import { EModalWidth, Input, ModalCore } from "@plane/ui";
import type {
  IExternalTokenProvider,
  IExternalTokenProviderPayload,
} from "@/services/integrations/oauth-bridge.service";

const ALGORITHM_OPTIONS = ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"];

interface ProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editProvider?: IExternalTokenProvider | null;
  onSave: (data: IExternalTokenProviderPayload) => Promise<void>;
}

type FormValues = Omit<IExternalTokenProviderPayload, "audience"> & {
  audienceInput: string;
};

const DEFAULT_VALUES: FormValues = {
  name: "",
  is_enabled: true,
  issuer: "",
  audienceInput: "",
  jwks_url: "",
  allowed_algorithms: ["RS256"],
  user_claims: "email",
  jwks_cache_ttl: 86400,
  rate_limit: null,
};

export const ProviderModal = ({ isOpen, onClose, editProvider, onSave }: ProviderModalProps) => {
  const { t } = useTranslation();
  const [isAlgoDropdownOpen, setIsAlgoDropdownOpen] = useState(false);

  const algoDropdownRef = useRef<HTMLDivElement>(null);
  useOutsideClickDetector(algoDropdownRef, () => setIsAlgoDropdownOpen(false));

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (editProvider) {
      reset({
        name: editProvider.name,
        is_enabled: editProvider.is_enabled,
        issuer: editProvider.issuer,
        audienceInput: Array.isArray(editProvider.audience) ? editProvider.audience.join(", ") : "",
        jwks_url: editProvider.jwks_url,
        allowed_algorithms: Array.isArray(editProvider.allowed_algorithms)
          ? editProvider.allowed_algorithms
          : ["RS256"],
        user_claims: editProvider.user_claims,
        jwks_cache_ttl: editProvider.jwks_cache_ttl,
        rate_limit: editProvider.rate_limit,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [editProvider, isOpen, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      const audienceList = data.audienceInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const { audienceInput: _, ...rest } = data;
      await onSave({ ...rest, audience: audienceList });
      onClose();
    } catch {
      // Error handled by parent
    }
  };

  const f = "oauth_bridge_integration.provider_form";

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} width={EModalWidth.LG}>
      <div className="flex flex-col max-h-[80vh]">
        {/* Title */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-body-md-medium">
            {editProvider ? t("oauth_bridge_integration.edit_provider") : t("oauth_bridge_integration.add_provider")}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 px-6 pb-6 overflow-y-auto vertical-scrollbar scrollbar-sm"
        >
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-body-xs-medium">
              {t(`${f}.name_label`)} <span className="text-danger-primary">*</span>
            </label>
            <Controller
              name="name"
              control={control}
              rules={{ required: t(`${f}.name_required`) }}
              render={({ field }) => (
                <Input type="text" {...field} placeholder={t(`${f}.name_placeholder`)} className="w-full" />
              )}
            />
            <p className="text-body-xs-regular text-tertiary">{t(`${f}.name_description`)}</p>
            {errors.name && <p className="text-body-xs-regular text-danger-primary">{errors.name.message}</p>}
          </div>

          {/* Issuer */}
          <div className="flex flex-col gap-1">
            <label className="text-body-xs-medium">
              {t(`${f}.issuer_label`)} <span className="text-danger-primary">*</span>
            </label>
            <Controller
              name="issuer"
              control={control}
              rules={{ required: t(`${f}.issuer_required`) }}
              render={({ field }) => (
                <Input type="text" {...field} placeholder={t(`${f}.issuer_placeholder`)} className="w-full" />
              )}
            />
            <p className="text-body-xs-regular text-tertiary">{t(`${f}.issuer_description`)}</p>
            {errors.issuer && <p className="text-body-xs-regular text-danger-primary">{errors.issuer.message}</p>}
          </div>

          {/* JWKS URL */}
          <div className="flex flex-col gap-1">
            <label className="text-body-xs-medium">
              {t(`${f}.jwks_url_label`)} <span className="text-danger-primary">*</span>
            </label>
            <Controller
              name="jwks_url"
              control={control}
              rules={{
                required: t(`${f}.jwks_url_required`),
                validate: (value) => value.startsWith("https://") || t(`${f}.jwks_url_https`),
              }}
              render={({ field }) => (
                <Input type="text" {...field} placeholder={t(`${f}.jwks_url_placeholder`)} className="w-full" />
              )}
            />
            <p className="text-body-xs-regular text-tertiary">{t(`${f}.jwks_url_description`)}</p>
            {errors.jwks_url && <p className="text-body-xs-regular text-danger-primary">{errors.jwks_url.message}</p>}
          </div>

          {/* Audience */}
          <div className="flex flex-col gap-1">
            <label className="text-body-xs-medium">
              {t(`${f}.audience_label`)} <span className="text-danger-primary">*</span>
            </label>
            <Controller
              name="audienceInput"
              control={control}
              render={({ field }) => (
                <Input type="text" {...field} placeholder={t(`${f}.audience_placeholder`)} className="w-full" />
              )}
            />
            <p className="text-body-xs-regular text-tertiary">{t(`${f}.audience_description`)}</p>
          </div>

          {/* User Claim */}
          <div className="flex flex-col gap-1">
            <label className="text-body-xs-medium">
              {t(`${f}.user_claims_label`)} <span className="text-danger-primary">*</span>
            </label>
            <Controller
              name="user_claims"
              control={control}
              rules={{ required: t(`${f}.user_claims_required`) }}
              render={({ field }) => (
                <Input type="text" {...field} placeholder={t(`${f}.user_claims_placeholder`)} className="w-full" />
              )}
            />
            <p className="text-body-xs-regular text-tertiary">{t(`${f}.user_claims_description`)}</p>
            {errors.user_claims && (
              <p className="text-body-xs-regular text-danger-primary">{errors.user_claims.message}</p>
            )}
          </div>

          {/* Allowed Algorithms — custom multi-select dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-body-xs-medium">
              {t(`${f}.allowed_algorithms_label`)} <span className="text-danger-primary">*</span>
            </label>
            <Controller
              name="allowed_algorithms"
              control={control}
              rules={{ validate: (value) => value.length > 0 || t(`${f}.allowed_algorithms_required`) }}
              render={({ field }) => {
                const algoDisplayText = field.value.length > 0 ? field.value.join(", ") : t(`${f}.select_algorithms`);
                const handleAlgorithmToggle = (alg: string) => {
                  field.onChange(
                    field.value.includes(alg) ? field.value.filter((a: string) => a !== alg) : [...field.value, alg]
                  );
                };
                return (
                  <div ref={algoDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAlgoDropdownOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-layer-1 border border-subtle rounded-md text-body-xs-regular text-left hover:border-strong transition-colors"
                    >
                      <span className={field.value.length === 0 ? "text-placeholder" : "text-primary"}>
                        {algoDisplayText}
                      </span>
                      <ChevronDown className="size-3.5 text-tertiary shrink-0 ml-2" />
                    </button>
                    {isAlgoDropdownOpen && (
                      <div className="absolute z-20 top-full left-0 mt-1 w-full bg-surface-1 border border-subtle rounded-md shadow-raised-200 overflow-hidden">
                        {ALGORITHM_OPTIONS.map((alg) => (
                          <label
                            key={alg}
                            className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-layer-1 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={field.value.includes(alg)}
                              onChange={() => handleAlgorithmToggle(alg)}
                              className="h-3.5 w-3.5 rounded border-subtle accent-accent-primary"
                            />
                            <span className="text-body-xs-regular">{alg}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <p className="text-body-xs-regular text-tertiary">{t(`${f}.allowed_algorithms_description`)}</p>
            {errors.allowed_algorithms && (
              <p className="text-body-xs-regular text-danger-primary">{errors.allowed_algorithms.message}</p>
            )}
          </div>

          {/* JWKS Cache TTL */}
          <div className="flex flex-col gap-1">
            <label className="text-body-xs-medium">
              {t(`${f}.jwks_cache_ttl_label`)} <span className="text-danger-primary">*</span>
            </label>
            <Controller
              name="jwks_cache_ttl"
              control={control}
              rules={{ validate: (value) => value >= 60 || t(`${f}.jwks_cache_ttl_min`) }}
              render={({ field }) => (
                <Input
                  type="number"
                  value={field.value}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 86400)}
                  placeholder="86400"
                  className="w-full"
                />
              )}
            />
            <p className="text-body-xs-regular text-tertiary">{t(`${f}.jwks_cache_ttl_description`)}</p>
            {errors.jwks_cache_ttl && (
              <p className="text-body-xs-regular text-danger-primary">{errors.jwks_cache_ttl.message}</p>
            )}
          </div>

          {/* Rate Limit */}
          <div className="flex flex-col gap-1">
            <label className="text-body-xs-medium">{t(`${f}.rate_limit_label`)}</label>
            <Controller
              name="rate_limit"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  placeholder={t(`${f}.rate_limit_placeholder`)}
                  className="w-full"
                />
              )}
            />
            <p className="text-body-xs-regular text-tertiary">{t(`${f}.rate_limit_description`)}</p>
          </div>

          {/* Enabled checkbox */}
          <Controller
            name="is_enabled"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="is_enabled"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 rounded border-subtle accent-accent-primary"
                />
                <span className="text-body-xs-medium">{t(`${f}.enable_provider`)}</span>
              </label>
            )}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {isSubmitting
                ? t("oauth_bridge_integration.provider_form.saving")
                : editProvider
                  ? t("oauth_bridge_integration.provider_form.update")
                  : t("oauth_bridge_integration.add_provider")}
            </Button>
          </div>
        </form>
      </div>
    </ModalCore>
  );
};
