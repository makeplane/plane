/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { CustomSelect, Input, Loader, ToggleSwitch } from "@plane/ui";
// services
import { CrmIntegrationService, type TCrmField, type TCrmIntegrationPayload } from "@/services/crm-integration.service";

const crmIntegrationService = new CrmIntegrationService();

type Props = {
  workspaceSlug: string;
};

const I18N = "workspace_settings.settings.crm_sync";

export const CrmSyncRoot = observer(function CrmSyncRoot({ workspaceSlug }: Props) {
  const { t } = useTranslation();

  // form state
  const [crmApiUrl, setCrmApiUrl] = useState("");
  const [crmApiKey, setCrmApiKey] = useState("");
  const [projectIdField, setProjectIdField] = useState<string | null>(null);
  const [invoiceHoursFieldId, setInvoiceHoursFieldId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  // ui state
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetchingFields, setIsFetchingFields] = useState(false);
  const [crmFields, setCrmFields] = useState<TCrmField[]>([]);

  // data
  const {
    data: integration,
    isLoading,
    mutate,
  } = useSWR(`CRM_INTEGRATION_${workspaceSlug}`, () => crmIntegrationService.retrieve(workspaceSlug));
  const { data: projectFields } = useSWR(`CRM_PROJECT_CUSTOM_FIELDS_${workspaceSlug}`, () =>
    crmIntegrationService.fetchProjectCustomFields(workspaceSlug)
  );
  const { data: logs, mutate: mutateLogs } = useSWR(`CRM_SYNC_LOGS_${workspaceSlug}`, () =>
    crmIntegrationService.fetchLogs(workspaceSlug)
  );

  // seed the form from the saved configuration
  useEffect(() => {
    if (!integration) return;
    setCrmApiUrl(integration.crm_api_url ?? "");
    setProjectIdField(integration.crm_project_id_custom_field ?? null);
    setInvoiceHoursFieldId(
      integration.crm_invoice_hours_field_id != null ? String(integration.crm_invoice_hours_field_id) : ""
    );
    setIsActive(integration.is_active ?? true);
  }, [integration]);

  const isConfigured = Boolean(integration?.id);
  const hasApiKey = Boolean(integration?.has_api_key);

  const buildPayload = (): TCrmIntegrationPayload => {
    const payload: TCrmIntegrationPayload = {
      crm_api_url: crmApiUrl.trim(),
      crm_project_id_custom_field: projectIdField || null,
      crm_invoice_hours_field_id: invoiceHoursFieldId ? Number(invoiceHoursFieldId) : null,
      is_active: isActive,
    };
    // only send the key when the admin actually entered one
    if (crmApiKey.trim()) payload.crm_api_key = crmApiKey.trim();
    return payload;
  };

  const handleSave = async () => {
    if (!crmApiUrl.trim()) {
      setToast({ type: TOAST_TYPE.ERROR, title: t(`${I18N}.form.crm_url_required`) });
      return;
    }
    // a key is required the first time the integration is created
    if (!isConfigured && !crmApiKey.trim()) {
      setToast({ type: TOAST_TYPE.ERROR, title: t(`${I18N}.form.api_key_required`) });
      return;
    }
    setIsSaving(true);
    try {
      const payload = buildPayload();
      const saved = isConfigured
        ? await crmIntegrationService.update(workspaceSlug, payload)
        : await crmIntegrationService.create(workspaceSlug, payload);
      await mutate(saved, { revalidate: false });
      setCrmApiKey("");
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t(`${I18N}.toasts.saved.title`),
        message: t(`${I18N}.toasts.saved.message`),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t(`${I18N}.toasts.error.title`),
        message: t(`${I18N}.toasts.error.message`),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await crmIntegrationService.testConnection(workspaceSlug, {
        crm_api_url: crmApiUrl.trim() || undefined,
        crm_api_key: crmApiKey.trim() || undefined,
      });
      if (result.success) {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t(`${I18N}.toasts.connection_ok.title`),
          message: t(`${I18N}.toasts.connection_ok.message`, { count: result.projects_count ?? 0 }),
        });
      } else {
        throw new Error(result.error);
      }
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t(`${I18N}.toasts.connection_failed.title`),
        message: t(`${I18N}.toasts.connection_failed.message`),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFetchFields = async () => {
    setIsFetchingFields(true);
    try {
      const result = await crmIntegrationService.fetchCrmFields(workspaceSlug, {
        crm_api_url: crmApiUrl.trim() || undefined,
        crm_api_key: crmApiKey.trim() || undefined,
        entity: "tasks",
      });
      setCrmFields(result.fields ?? []);
      // auto-select the field named "Invoice hours" when present
      const invoiceField = (result.fields ?? []).find((f) => /invoice/i.test(f.name) && /hour/i.test(f.name));
      if (invoiceField) setInvoiceHoursFieldId(String(invoiceField.id));
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t(`${I18N}.toasts.connection_failed.title`),
        message: t(`${I18N}.toasts.connection_failed.message`),
      });
    } finally {
      setIsFetchingFields(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await crmIntegrationService.syncNow(workspaceSlug);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t(`${I18N}.toasts.sync_started.title`),
        message: t(`${I18N}.toasts.sync_started.message`),
      });
      // refresh the log list shortly after kicking off the run
      setTimeout(() => mutateLogs(), 2000);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t(`${I18N}.toasts.error.title`),
        message: t(`${I18N}.toasts.error.message`),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading && !integration) {
    return (
      <Loader className="mt-4 space-y-4">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );
  }

  return (
    <div className="mt-4 w-full max-w-3xl space-y-6">
      {/* CRM base URL */}
      <div className="flex flex-col gap-1">
        <label htmlFor="crm-url" className="text-body-sm-medium text-secondary">
          {t(`${I18N}.form.crm_url`)}
        </label>
        <Input
          id="crm-url"
          type="url"
          value={crmApiUrl}
          onChange={(e) => setCrmApiUrl(e.target.value)}
          placeholder={t(`${I18N}.form.crm_url_placeholder`)}
          className="w-full"
        />
      </div>

      {/* API key */}
      <div className="flex flex-col gap-1">
        <label htmlFor="crm-key" className="text-body-sm-medium text-secondary">
          {t(`${I18N}.form.api_key`)}
        </label>
        <Input
          id="crm-key"
          type="password"
          autoComplete="off"
          value={crmApiKey}
          onChange={(e) => setCrmApiKey(e.target.value)}
          placeholder={hasApiKey ? t(`${I18N}.form.api_key_set`) : t(`${I18N}.form.api_key_placeholder`)}
          className="w-full"
        />
      </div>

      {/* Plane project custom field */}
      <div className="flex flex-col gap-1">
        <label className="text-body-sm-medium text-secondary">{t(`${I18N}.form.project_id_field`)}</label>
        <CustomSelect
          value={projectIdField}
          onChange={(val: string | null) => setProjectIdField(val)}
          label={
            <span className={projectIdField ? "" : "text-placeholder"}>
              {projectFields?.find((f) => f.id === projectIdField)?.display_name ??
                t(`${I18N}.form.project_id_field_none`)}
            </span>
          }
          className="w-full"
          buttonClassName="w-full justify-between"
          input
        >
          <CustomSelect.Option value={null}>{t(`${I18N}.form.project_id_field_none`)}</CustomSelect.Option>
          {(projectFields ?? []).map((field) => (
            <CustomSelect.Option key={field.id} value={field.id}>
              {field.display_name}
            </CustomSelect.Option>
          ))}
        </CustomSelect>
        <p className="text-body-xs-regular text-tertiary">{t(`${I18N}.form.project_id_field_help`)}</p>
      </div>

      {/* CRM invoice-hours field id */}
      <div className="flex flex-col gap-1">
        <label htmlFor="crm-invoice-field" className="text-body-sm-medium text-secondary">
          {t(`${I18N}.form.invoice_hours_field`)}
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="crm-invoice-field"
            type="number"
            min={1}
            value={invoiceHoursFieldId}
            onChange={(e) => setInvoiceHoursFieldId(e.target.value)}
            className="w-40"
          />
          <Button variant="secondary" size="sm" onClick={handleFetchFields} loading={isFetchingFields}>
            {t(`${I18N}.form.fetch_fields`)}
          </Button>
        </div>
        {crmFields.length > 0 && (
          <div className="mt-2">
            <CustomSelect
              value={invoiceHoursFieldId ? Number(invoiceHoursFieldId) : null}
              onChange={(val: number | null) => setInvoiceHoursFieldId(val != null ? String(val) : "")}
              label={
                <span className={invoiceHoursFieldId ? "" : "text-placeholder"}>
                  {crmFields.find((f) => String(f.id) === invoiceHoursFieldId)?.name ??
                    t(`${I18N}.form.invoice_hours_field`)}
                </span>
              }
              className="w-full max-w-md"
              buttonClassName="w-full justify-between"
              input
            >
              {crmFields.map((field) => (
                <CustomSelect.Option key={field.id} value={field.id}>
                  {field.name} (#{field.id})
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </div>
        )}
        <p className="text-body-xs-regular text-tertiary">{t(`${I18N}.form.invoice_hours_field_help`)}</p>
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-body-sm-medium text-secondary">{t(`${I18N}.form.active`)}</span>
          <p className="text-body-xs-regular text-tertiary">{t(`${I18N}.form.active_help`)}</p>
        </div>
        <ToggleSwitch value={isActive} onChange={setIsActive} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-subtle pt-4">
        <Button variant="primary" onClick={handleSave} loading={isSaving}>
          {t(`${I18N}.form.save`)}
        </Button>
        <Button variant="secondary" onClick={handleTestConnection} loading={isTesting}>
          {t(`${I18N}.form.test_connection`)}
        </Button>
        <Button variant="secondary" onClick={handleSyncNow} loading={isSyncing} disabled={!isConfigured || !isActive}>
          {t(`${I18N}.form.sync_now`)}
        </Button>
      </div>

      {/* Recent syncs */}
      <CrmSyncLogs logs={logs ?? []} />
    </div>
  );
});

type LogsProps = {
  logs: {
    id: string;
    sync_month: string;
    status: string;
    projects_synced: number;
    projects_skipped: number;
    projects_processed: number;
    created_at: string;
  }[];
};

function CrmSyncLogs({ logs }: LogsProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 border-t border-subtle pt-4">
      <h4 className="text-h6-medium text-primary">{t(`${I18N}.logs.title`)}</h4>
      {logs.length === 0 ? (
        <p className="text-body-sm-regular text-tertiary">{t(`${I18N}.logs.empty`)}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm-regular">
            <thead className="text-tertiary">
              <tr className="border-b border-subtle text-left">
                <th className="py-2 pr-4 font-medium">{t(`${I18N}.logs.month`)}</th>
                <th className="py-2 pr-4 font-medium">{t(`${I18N}.logs.status`)}</th>
                <th className="py-2 pr-4 font-medium">{t(`${I18N}.logs.synced`)}</th>
                <th className="py-2 pr-4 font-medium">{t(`${I18N}.logs.skipped`)}</th>
                <th className="py-2 pr-4 font-medium">{t(`${I18N}.logs.ran_at`)}</th>
              </tr>
            </thead>
            <tbody className="text-secondary">
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-subtle">
                  <td className="py-2 pr-4">{log.sync_month}</td>
                  <td className="py-2 pr-4 capitalize">{log.status}</td>
                  <td className="py-2 pr-4">{log.projects_synced}</td>
                  <td className="py-2 pr-4">{log.projects_skipped}</td>
                  <td className="py-2 pr-4">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
