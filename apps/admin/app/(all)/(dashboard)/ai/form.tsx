/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import type { IAIProviderProfile, TAIProviderCreate, TAIProviderUpdate } from "@plane/types";
import { useInstance } from "@/hooks/store";
import { TOAST_TYPE, setToast } from "@/providers/toast";

const emptyProvider: TAIProviderCreate = {
  name: "",
  slug: "",
  protocol: "openai_compatible",
  base_url: "https://api.openai.com/v1",
  organization_id: "",
  project_id: "",
  default_model: "gpt-4o-mini",
  enabled: true,
  is_default: false,
  timeout_seconds: 30,
  max_retries: 2,
  temperature: 0.2,
  top_p: null,
  max_output_tokens: null,
  api_key: "",
};

// Cosmetic casing for the hosts people actually point at; anything else is
// capitalized from its domain label. Azure OpenAI is deliberately absent: it needs
// an api-version query and an api-key header, neither of which the adapter sends.
const providerDisplayNames: Record<string, string> = {
  "openai.com": "OpenAI",
  "anthropic.com": "Anthropic",
};

/**
 * Derives a provider name and slug from the base URL, so the two fields that only
 * exist to identify the row do not have to be typed. `https://api.openai.com/v1`
 * gives { name: "OpenAI", slug: "openai" }.
 */
const deriveProviderIdentity = (baseUrl: string) => {
  let labels: string[] = [];
  try {
    labels = new URL(baseUrl).hostname.split(".");
  } catch {
    return { name: "", slug: "" };
  }
  const domain = labels.slice(-2).join(".");
  const label = labels.find((part) => !["api", "www", "ai"].includes(part)) ?? "";
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const name = providerDisplayNames[domain] ?? (label ? label.charAt(0).toUpperCase() + label.slice(1) : "");
  return { name, slug };
};

/** Pulls a readable message out of a test result or a validation error body. */
const describeFailure = (result: unknown) => {
  const body = result as Record<string, unknown> | undefined;
  if (!body) return "The provider could not be reached.";
  if (typeof body.error_code === "string" && body.error_code) return body.error_code;
  const [firstValue] = Object.values(body);
  // DRF validation errors arrive as {field: ["message"]}, the base view handler as
  // {"error": "message"}, the AI views as {"error_code": "..."}.
  if (typeof firstValue === "string" && firstValue) return firstValue;
  if (Array.isArray(firstValue) && firstValue.length > 0) return String(firstValue[0]);
  return "The provider could not be reached.";
};

export function InstanceAIForm({ providers }: { providers: IAIProviderProfile[] }) {
  const {
    createAIProvider,
    updateAIProvider,
    deleteAIProvider,
    setDefaultAIProvider,
    testAIDraftConnection,
    createAIModel,
    discoverAIModels,
    updateAIModel,
    importLegacyAIProvider,
  } = useInstance();
  const [selected, setSelected] = useState<IAIProviderProfile | null>(providers[0] ?? null);
  const [draft, setDraft] = useState<TAIProviderCreate | TAIProviderUpdate>(
    selected ?? { ...emptyProvider, ...deriveProviderIdentity(emptyProvider.base_url) }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  // Name and slug are derived from the base URL until the admin edits them (or
  // opens a saved provider, whose values are already deliberate).
  const [isIdentityCustomized, setIsIdentityCustomized] = useState(Boolean(selected));
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [newModelId, setNewModelId] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const currentProvider = selected ? (providers.find((provider) => provider.id === selected.id) ?? selected) : null;

  // The store owns the list. Re-point the selection at the fresh row after every
  // mutation (a new default flag, a newly stored key) and fall back to a blank form
  // when the row is gone, instead of holding a snapshot that stops matching.
  useEffect(() => {
    if (!selected) return;
    const fresh = providers.find((provider) => provider.id === selected.id);
    if (!fresh) startNewProvider();
    else if (fresh !== selected) setSelected(fresh);
  }, [providers, selected]);

  const selectProvider = (provider: IAIProviderProfile) => {
    setSelected(provider);
    setDraft({ ...provider, api_key: "" });
    setIsIdentityCustomized(true);
  };

  const startNewProvider = () => {
    setSelected(null);
    setDraft({ ...emptyProvider, ...deriveProviderIdentity(emptyProvider.base_url) });
    setIsIdentityCustomized(false);
  };

  const updateField = (key: string, value: string | number | boolean | null) => {
    if (key === "name" || key === "slug") setIsIdentityCustomized(true);
    setDraft((current) => {
      const next = { ...current, [key]: value };
      if (key === "base_url" && !isIdentityCustomized) Object.assign(next, deriveProviderIdentity(String(value)));
      return next;
    });
  };

  /** The draft with name/slug filled in from the base URL when they are still empty. */
  const resolvedDraft = () => {
    const identity = deriveProviderIdentity(draft.base_url ?? "");
    return {
      ...draft,
      name: draft.name || identity.name || "AI provider",
      slug: draft.slug || identity.slug || "provider",
    };
  };

  const isDraftTestable = Boolean(draft.base_url && draft.default_model);
  // "Leave blank to keep" only holds while the host still matches the saved row: the
  // API will not pair a stored secret with a host that came from the form.
  const usesStoredSecret = Boolean(selected && !draft.api_key && draft.base_url === selected.base_url);
  // A new provider without a key could never serve a request, so refuse it rather
  // than persisting a row that always fails.
  const canSave = Boolean(draft.base_url && draft.default_model && (selected || draft.api_key));
  const saveHint =
    !draft.base_url || !draft.default_model
      ? "A base URL and a default model are required."
      : !selected && !draft.api_key
        ? "An API key is required to save a new provider."
        : null;

  const save = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const payload = resolvedDraft();
      if (selected) {
        const update: TAIProviderUpdate = { ...payload };
        if (!update.api_key) delete update.api_key;
        await updateAIProvider(selected.id, update);
      } else {
        selectProvider(await createAIProvider(payload as TAIProviderCreate));
      }
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Success", message: "AI provider saved" });
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Could not save the provider", message: describeFailure(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const testDraft = async () => {
    if (!isDraftTestable) return;
    setIsTesting(true);
    try {
      const result = await testAIDraftConnection({
        base_url: draft.base_url ?? "",
        api_key: draft.api_key || undefined,
        default_model: draft.default_model ?? "",
        organization_id: draft.organization_id || undefined,
        project_id: draft.project_id || undefined,
        timeout_seconds: draft.timeout_seconds ?? undefined,
        max_retries: draft.max_retries ?? undefined,
        // Only claim "use the stored secret" while the host still matches the row it
        // belongs to; the API refuses to pair a stored key with another host anyway.
        provider_id: usesStoredSecret ? selected?.id : undefined,
      });
      setToast({
        type: result.success ? TOAST_TYPE.SUCCESS : TOAST_TYPE.ERROR,
        title: result.success ? "Connection successful" : "Connection failed",
        message: result.success ? `The provider answered for ${result.model}.` : describeFailure(result),
      });
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Connection failed", message: describeFailure(error) });
    } finally {
      setIsTesting(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    try {
      await deleteAIProvider(selected.id);
      startNewProvider();
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Success", message: "AI provider deleted" });
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Could not delete the provider", message: describeFailure(error) });
    }
  };

  const setDefault = async () => {
    if (!selected) return;
    try {
      await setDefaultAIProvider(selected.id);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not set the default provider",
        message: describeFailure(error),
      });
    }
  };

  const importLegacy = async () => {
    try {
      selectProvider(await importLegacyAIProvider());
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Success", message: "Legacy settings imported" });
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Import failed", message: describeFailure(error) });
    }
  };

  const addModel = async () => {
    if (!selected || !newModelId.trim()) return;
    try {
      await createAIModel(selected.id, { model_id: newModelId.trim(), enabled: true, capabilities: ["chat"] });
      setNewModelId("");
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Could not add the model", message: describeFailure(error) });
    }
  };

  const toggleModel = async (modelId: string, enabled: boolean) => {
    if (!currentProvider) return;
    try {
      await updateAIModel(currentProvider.id, modelId, { enabled });
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Could not update the model", message: describeFailure(error) });
    }
  };

  const discoverModels = async () => {
    if (!selected) return;
    setIsDiscovering(true);
    try {
      const result = await discoverAIModels(selected.id);
      setToast({
        type: result.success ? TOAST_TYPE.SUCCESS : TOAST_TYPE.ERROR,
        title: result.success ? "Models discovered" : "Discovery failed",
        message: result.success
          ? `${result.models?.length ?? 0} models found.`
          : (result.error_code ?? "Unknown error"),
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-14 font-medium text-primary">Providers</h3>
          <Button label="Add" variant="secondary" size="sm" stretch="auto" onClick={startNewProvider} />
        </div>
        {providers.length === 0 && (
          <div className="space-y-2">
            <p className="text-13 text-tertiary">No providers configured.</p>
            <Button
              label="Import legacy settings"
              variant="secondary"
              size="sm"
              stretch="auto"
              onClick={importLegacy}
            />
          </div>
        )}
        {providers.map((provider) => (
          <button
            type="button"
            key={provider.id}
            onClick={() => selectProvider(provider)}
            className={`w-full rounded border p-3 text-left ${selected?.id === provider.id ? "border-accent-primary" : "border-subtle"}`}
          >
            <div className="text-13 font-medium text-primary">{provider.name}</div>
            <div className="text-11 text-tertiary">{provider.base_url}</div>
            {provider.is_default && <div className="pt-1 text-11 text-accent-primary">Default provider</div>}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label htmlFor="ai-provider-api-key" className="flex flex-col gap-1 text-13 text-tertiary">
            API key
            {currentProvider?.has_api_key && (
              <span className="text-11 text-accent-primary">(configured; leave blank to keep)</span>
            )}
            <InputGroup size="lg">
              <Input
                id="ai-provider-api-key"
                size="lg"
                type="password"
                value={draft.api_key ?? ""}
                onChange={(event) => updateField("api_key", event.target.value)}
              />
            </InputGroup>
          </label>
          <label htmlFor="ai-provider-base-url" className="flex flex-col gap-1 text-13 text-tertiary">
            Base URL
            <InputGroup size="lg">
              <Input
                id="ai-provider-base-url"
                size="lg"
                value={String(draft.base_url ?? "")}
                onChange={(event) => updateField("base_url", event.target.value)}
                placeholder="https://api.example.com/v1"
              />
            </InputGroup>
          </label>
          <label htmlFor="ai-provider-default-model" className="flex flex-col gap-1 text-13 text-tertiary">
            Default model
            <InputGroup size="lg">
              <Input
                id="ai-provider-default-model"
                size="lg"
                value={String(draft.default_model ?? "")}
                onChange={(event) => updateField("default_model", event.target.value)}
                placeholder="gpt-4o-mini"
              />
            </InputGroup>
          </label>
        </div>

        <div className="space-y-5">
          <button
            type="button"
            aria-expanded={isAdvancedOpen}
            onClick={() => setIsAdvancedOpen((open) => !open)}
            className="text-13 text-tertiary hover:text-secondary"
          >
            {isAdvancedOpen ? "▾" : "▸"} Advanced settings
          </button>
          {isAdvancedOpen && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label htmlFor="ai-provider-name" className="flex flex-col gap-1 text-13 text-tertiary">
                Name
                <InputGroup size="lg">
                  <Input
                    id="ai-provider-name"
                    size="lg"
                    value={String(draft.name ?? "")}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Derived from the base URL"
                  />
                </InputGroup>
              </label>
              <label htmlFor="ai-provider-slug" className="flex flex-col gap-1 text-13 text-tertiary">
                Slug
                <InputGroup size="lg">
                  <Input
                    id="ai-provider-slug"
                    size="lg"
                    value={String(draft.slug ?? "")}
                    onChange={(event) => updateField("slug", event.target.value)}
                    placeholder="Derived from the base URL"
                  />
                </InputGroup>
              </label>
              <label htmlFor="ai-provider-organization-id" className="flex flex-col gap-1 text-13 text-tertiary">
                Organization ID
                <InputGroup size="lg">
                  <Input
                    id="ai-provider-organization-id"
                    size="lg"
                    value={String(draft.organization_id ?? "")}
                    onChange={(event) => updateField("organization_id", event.target.value)}
                  />
                </InputGroup>
              </label>
              <label htmlFor="ai-provider-project-id" className="flex flex-col gap-1 text-13 text-tertiary">
                Project ID
                <InputGroup size="lg">
                  <Input
                    id="ai-provider-project-id"
                    size="lg"
                    value={String(draft.project_id ?? "")}
                    onChange={(event) => updateField("project_id", event.target.value)}
                  />
                </InputGroup>
              </label>
              <label htmlFor="ai-provider-timeout" className="flex flex-col gap-1 text-13 text-tertiary">
                Timeout (seconds)
                <InputGroup size="lg">
                  <Input
                    id="ai-provider-timeout"
                    size="lg"
                    type="number"
                    value={String(draft.timeout_seconds ?? 30)}
                    onChange={(event) => updateField("timeout_seconds", Number(event.target.value))}
                  />
                </InputGroup>
              </label>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            label={isSaving ? "Saving" : "Save provider"}
            variant="primary"
            size="md"
            stretch="auto"
            loading={isSaving}
            disabled={!canSave}
            onClick={save}
          />
          <Button
            label={isTesting ? "Testing" : "Test connection"}
            variant="secondary"
            size="md"
            stretch="auto"
            loading={isTesting}
            disabled={!isDraftTestable}
            onClick={testDraft}
          />
          {currentProvider && !currentProvider.is_default && (
            <Button label="Set as default" variant="secondary" size="md" stretch="auto" onClick={setDefault} />
          )}
          {currentProvider && !currentProvider.is_default && (
            <Button label="Delete" variant="secondary" size="md" stretch="auto" onClick={remove} />
          )}
        </div>
        {saveHint && <p className="text-12 text-tertiary">{saveHint}</p>}
        {currentProvider && (
          <div className="space-y-3 border-t border-subtle pt-5">
            <div className="flex flex-wrap items-end gap-3">
              <label htmlFor="ai-provider-model" className="flex min-w-64 flex-col gap-1 text-13 text-tertiary">
                Model ID
                <InputGroup size="lg">
                  <Input
                    id="ai-provider-model"
                    size="lg"
                    value={newModelId}
                    onChange={(event) => setNewModelId(event.target.value)}
                    placeholder="gpt-4o-mini"
                  />
                </InputGroup>
              </label>
              <Button label="Add model" variant="secondary" size="md" stretch="auto" onClick={addModel} />
              <Button
                label={isDiscovering ? "Discovering" : "Discover models"}
                variant="secondary"
                size="md"
                stretch="auto"
                loading={isDiscovering}
                onClick={discoverModels}
              />
            </div>
            <div className="space-y-2">
              {currentProvider.model_profiles.length === 0 && (
                <p className="text-12 text-tertiary">No model profiles yet. The default model remains available.</p>
              )}
              {currentProvider.model_profiles.map((model) => (
                <div key={model.id} className="flex items-center justify-between rounded border border-subtle p-3">
                  <div>
                    <div className="text-13 font-medium text-primary">{model.display_name || model.model_id}</div>
                    <div className="text-11 text-tertiary">{model.model_id}</div>
                  </div>
                  <Button
                    label={model.enabled ? "Disable" : "Enable"}
                    variant="secondary"
                    size="sm"
                    stretch="auto"
                    onClick={() => toggleModel(model.model_id, !model.enabled)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="text-12 text-tertiary">
          Secrets are encrypted on the server and are never returned to this page.
        </p>
      </div>
    </div>
  );
}
