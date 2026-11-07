/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// plane imports
import { Banner } from "@makeplane/propel/components/banner";
import { Button } from "@makeplane/propel/components/button";
import { Collapsible } from "@makeplane/propel/components/collapsible";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { InputField } from "@makeplane/propel/components/input-field";
import { SelectField } from "@makeplane/propel/components/select-field";
import { SwitchField } from "@makeplane/propel/components/switch-field";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { setToast } from "@plane/blocks/toast";
import { AGENT_ADAPTER_MODELS, AGENT_ADAPTERS, AGENT_MODEL_ENV_KEY, AGENT_PERMISSION_LEVELS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { InstanceAgentService } from "@plane/services";
import type { TAgentAdapter, TAgentPermissionLevel, TInstanceAgent } from "@plane/types";
// local imports
import { AgentEnvField } from "./env-field";
import {
  allowedDefaultLevels,
  buildPayload,
  createFormState,
  envValue,
  fallbackEnvFieldsFor,
  MODEL_CUSTOM,
  MODEL_DEFAULT,
  modelSelection,
  otherEnvKeys,
  serverFieldErrors,
  settingEnvFieldsFor,
  slugify,
  validateForm,
  withAdapter,
  withMaxLevel,
  withModelSelection,
} from "./form-state";
import type { TAgentFormErrors, TAgentFormState } from "./form-state";
import type { TAgentEnvField } from "@plane/constants";

const agentService = new InstanceAgentService();

type Props = {
  isOpen: boolean;
  /** The agent to edit; none to add one. */
  agent?: TInstanceAgent;
  onClose: () => void;
  onSaved: (agent: TInstanceAgent) => void;
};

/** Add or edit an agent: adapter, write-only credentials, permission levels and toggles. */
export function AgentFormDialog({ isOpen, agent, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<TAgentFormState>(() => createFormState(agent));
  const [errors, setErrors] = useState<TAgentFormErrors>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Fallback credentials start collapsed unless one is saved or the saved env must be re-entered.
  const [isFallbackOpen, setIsFallbackOpen] = useState(
    () =>
      !!agent?.env_decryption_failed ||
      fallbackEnvFieldsFor(agent?.adapter ?? "claude").some((field) => field.key in (agent?.env ?? {}))
  );

  const levelLabel = (level: TAgentPermissionLevel) => t(`agents.permission.levels.${level}.name`);
  const fieldError = (key: string) => {
    const error = errors[key];
    return error ? t(`agents.admin.form.validation.${error}`) : serverErrors[key];
  };
  const update = (patch: Partial<TAgentFormState>) => setForm((current) => ({ ...current, ...patch }));

  const handleSubmit = async () => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setServerErrors({});
    if (Object.keys(nextErrors).length > 0) return;
    setIsSubmitting(true);
    try {
      const payload = buildPayload(form, agent);
      const saved = agent ? await agentService.update(agent.id, payload) : await agentService.create(payload);
      setToast({ type: "success", title: t(agent ? "agents.admin.toasts.updated" : "agents.admin.toasts.created") });
      onSaved(saved);
    } catch (error) {
      const fieldErrors = serverFieldErrors(error);
      setServerErrors(fieldErrors);
      setToast({
        type: "error",
        title: t("agents.admin.toasts.error_title"),
        message:
          fieldErrors.non_field_errors ?? fieldErrors.env ?? fieldErrors.detail ?? t("agents.admin.toasts.save_failed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const others = otherEnvKeys(form);
  const settingFields = settingEnvFieldsFor(form.adapter);
  const fallbackFields = fallbackEnvFieldsFor(form.adapter);
  const savedFallbackCount = fallbackFields.filter((field) => {
    const entry = envValue(form, field.key);
    return entry.saved && !entry.remove;
  }).length;
  const selectedModel = modelSelection(form);
  const modelError = fieldError(AGENT_MODEL_ENV_KEY);

  const renderEnvField = (field: TAgentEnvField) => {
    const error = fieldError(field.key);
    return (
      <AgentEnvField
        key={field.key}
        field={field}
        entry={envValue(form, field.key)}
        {...(error ? { error } : {})}
        onChange={(entry) => update({ env: { ...form.env, [field.key]: entry } })}
      />
    );
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent size="lg">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>
                {agent ? t("agents.admin.edit_named", { name: agent.name }) : t("agents.admin.add")}
              </DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody>
            <form
              id="agent-form"
              className="flex flex-col gap-5"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              {agent?.env_decryption_failed && (
                <Banner placement="inline" variant="warning" title={t("agents.admin.form.env_unreadable")} />
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  id="agent-name"
                  name="name"
                  size="lg"
                  orientation="vertical"
                  label={t("agents.admin.form.name")}
                  required
                  placeholder={t("agents.admin.form.name_placeholder")}
                  value={form.name}
                  {...(fieldError("name") ? { error: fieldError("name") } : {})}
                  onChange={(event) => {
                    const name = event.target.value;
                    update(form.slugTouched ? { name } : { name, slug: slugify(name) });
                  }}
                />
                <InputField
                  id="agent-slug"
                  name="slug"
                  size="lg"
                  orientation="vertical"
                  label={t("agents.admin.form.slug")}
                  required
                  description={t("agents.admin.form.slug_help")}
                  value={form.slug}
                  {...(fieldError("slug") ? { error: fieldError("slug") } : {})}
                  onChange={(event) => update({ slug: event.target.value, slugTouched: true })}
                />
              </div>
              <TextAreaField
                id="agent-description"
                name="description"
                size="lg"
                autoResize
                maxRows={4}
                label={t("agents.admin.form.description")}
                placeholder={t("agents.admin.form.description_placeholder")}
                value={form.description}
                {...(fieldError("description") ? { error: fieldError("description") } : {})}
                onChange={(event) => update({ description: event.target.value })}
              />
              <SelectField<TAgentAdapter>
                name="adapter"
                size="lg"
                label={t("agents.admin.form.adapter")}
                value={form.adapter}
                options={AGENT_ADAPTERS.map((adapter) => ({
                  value: adapter,
                  label: t(`agents.admin.form.adapters.${adapter}`),
                }))}
                {...(fieldError("adapter") ? { error: fieldError("adapter") } : {})}
                onValueChange={(adapter) => {
                  if (adapter) setForm((current) => withAdapter(current, adapter));
                }}
              />

              <div className="flex flex-col gap-3">
                <SelectField<string>
                  name="default_model"
                  size="lg"
                  label={t("agents.admin.form.env.PLANE_AGENT_MODEL.label")}
                  description={t("agents.admin.form.model_help")}
                  value={selectedModel}
                  options={[
                    { value: MODEL_DEFAULT, label: t("agents.admin.form.model_default") },
                    "separator",
                    ...(AGENT_ADAPTER_MODELS[form.adapter] ?? []).map((model) => ({
                      value: model.value,
                      label: model.name,
                    })),
                    "separator",
                    { value: MODEL_CUSTOM, label: t("agents.admin.form.model_custom") },
                  ]}
                  {...(modelError && selectedModel !== MODEL_CUSTOM ? { error: modelError } : {})}
                  onValueChange={(selection) => {
                    if (selection) setForm((current) => withModelSelection(current, selection));
                  }}
                />
                {selectedModel === MODEL_CUSTOM && (
                  <InputField
                    id="agent-model-custom"
                    name={AGENT_MODEL_ENV_KEY}
                    size="lg"
                    orientation="vertical"
                    label={t("agents.admin.form.model_custom_id")}
                    description={t("agents.admin.form.model_custom_id_help")}
                    value={envValue(form, AGENT_MODEL_ENV_KEY).value}
                    {...(modelError ? { error: modelError } : {})}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) =>
                      update({
                        env: {
                          ...form.env,
                          [AGENT_MODEL_ENV_KEY]: { ...envValue(form, AGENT_MODEL_ENV_KEY), value: event.target.value },
                        },
                      })
                    }
                  />
                )}
                {settingFields.map(renderEnvField)}
              </div>

              {fallbackFields.length > 0 && (
                <div className="rounded-md border border-subtle">
                  <Collapsible
                    open={isFallbackOpen || fallbackFields.some((field) => !!fieldError(field.key))}
                    onOpenChange={setIsFallbackOpen}
                    trigger={
                      <span className="flex flex-col items-start gap-0.5 text-left">
                        <span className="text-body-sm-medium text-primary">
                          {t("agents.admin.form.fallback_credentials")}
                          {savedFallbackCount > 0 &&
                            ` · ${t("agents.admin.form.fallback_saved", { count: savedFallbackCount })}`}
                        </span>
                        <span className="text-caption-md-regular text-tertiary">
                          {t("agents.admin.form.fallback_credentials_summary")}
                        </span>
                      </span>
                    }
                  >
                    <div className="flex flex-col gap-3">
                      <span className="text-caption-md-regular text-tertiary">
                        {t("agents.admin.form.credentials_help")}
                      </span>
                      {fallbackFields.map(renderEnvField)}
                    </div>
                  </Collapsible>
                </div>
              )}

              {(serverErrors.env || others.length > 0) && (
                <div className="flex flex-col gap-3">
                  {serverErrors.env && (
                    <p className="text-caption-md-regular text-danger-primary">{serverErrors.env}</p>
                  )}
                  {others.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col">
                        <span className="text-body-xs-medium text-primary">{t("agents.admin.form.other_env")}</span>
                        <span className="text-caption-md-regular text-tertiary">
                          {t("agents.admin.form.other_env_help")}
                        </span>
                      </div>
                      <ul className="flex flex-col gap-1">
                        {others.map((key) => {
                          const entry = envValue(form, key);
                          return (
                            <li key={key} className="flex items-center justify-between gap-2">
                              <code className={entry.remove ? "text-tertiary line-through" : "text-secondary"}>
                                {key}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                stretch="auto"
                                label={t(entry.remove ? "agents.admin.form.undo_remove" : "agents.admin.form.remove")}
                                aria-label={`${t(entry.remove ? "agents.admin.form.undo_remove" : "agents.admin.form.remove")}: ${key}`}
                                onClick={() =>
                                  update({ env: { ...form.env, [key]: { ...entry, remove: !entry.remove } } })
                                }
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField<TAgentPermissionLevel>
                  name="default_permission_level"
                  size="lg"
                  label={t("agents.admin.form.default_level")}
                  description={t("agents.admin.form.default_level_help")}
                  value={form.default_permission_level}
                  options={allowedDefaultLevels(form.max_permission_level).map((level) => ({
                    value: level,
                    label: levelLabel(level),
                  }))}
                  {...(fieldError("default_permission_level") ? { error: fieldError("default_permission_level") } : {})}
                  onValueChange={(level) => {
                    if (level) update({ default_permission_level: level });
                  }}
                />
                <SelectField<TAgentPermissionLevel>
                  name="max_permission_level"
                  size="lg"
                  label={t("agents.admin.form.max_level")}
                  description={t("agents.admin.form.max_level_help")}
                  value={form.max_permission_level}
                  options={AGENT_PERMISSION_LEVELS.map((level) => ({ value: level, label: levelLabel(level) }))}
                  {...(fieldError("max_permission_level") ? { error: fieldError("max_permission_level") } : {})}
                  onValueChange={(level) => {
                    if (level) setForm((current) => withMaxLevel(current, level));
                  }}
                />
              </div>

              <div className="flex flex-col gap-3">
                <SwitchField
                  name="attach_plane_mcp"
                  size="lg"
                  switchSize="md"
                  label={t("agents.admin.form.attach_plane_mcp")}
                  description={t("agents.admin.form.attach_plane_mcp_help")}
                  checked={form.attach_plane_mcp}
                  onCheckedChange={(checked) => update({ attach_plane_mcp: checked })}
                />
                <SwitchField
                  name="is_enabled"
                  size="lg"
                  switchSize="md"
                  label={t("agents.admin.form.is_enabled")}
                  description={t("agents.admin.form.is_enabled_help")}
                  checked={form.is_enabled}
                  onCheckedChange={(checked) => update({ is_enabled: checked })}
                />
              </div>
            </form>
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button
            variant="secondary"
            size="md"
            stretch="auto"
            label={t("agents.admin.form.cancel")}
            disabled={isSubmitting}
            onClick={onClose}
          />
          <Button
            type="submit"
            form="agent-form"
            variant="primary"
            size="md"
            stretch="auto"
            loading={isSubmitting}
            label={
              isSubmitting
                ? t("agents.admin.form.saving")
                : t(agent ? "agents.admin.form.save" : "agents.admin.form.create")
            }
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
