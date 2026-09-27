/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Per-card query configuration (spec §9).
 *
 * The dashboard is not a query builder: a card renders only the controls it
 * declared in its registry entry, and every option is a key the Analytics V2
 * registries already accept. A change here is written against one card id, so
 * only that card's slice of the batch payload moves (§20).
 */

import { useState } from "react";
import {
  ANALYTICS_ALLOCATION_OPTIONS,
  ANALYTICS_DATE_BASIS_OPTIONS,
  ANALYTICS_DATE_GROUPING_OPTIONS,
  ANALYTICS_DISPLAY_OPTIONS,
  ANALYTICS_NORMALIZATION_OPTIONS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CustomSearchSelect } from "@plane/ui";
import type {
  TAnalyticsAllocation,
  TAnalyticsDateGrouping,
  TAnalyticsDisplay,
  TAnalyticsNormalization,
} from "@plane/types";
import { METRIC_LABELS } from "@/components/analytics/v2/mapping";

import {
  DASHBOARD_DIMENSION_LABELS,
  DASHBOARD_RENDERER_LABELS,
  type TCardControl,
  type TCardDefinition,
  type TCardPreference,
  type TCardRenderer,
} from "./card-registry";

const METRIC_OPTIONS = (
  keys: readonly string[] | undefined
): { value: string; query: string; content: React.ReactNode }[] =>
  (keys ?? []).map((key) => ({
    value: key,
    query: METRIC_LABELS[key as keyof typeof METRIC_LABELS] ?? key,
    content: <span>{METRIC_LABELS[key as keyof typeof METRIC_LABELS] ?? key}</span>,
  }));

const DIMENSION_OPTIONS = (
  keys: readonly string[] | undefined
): { value: string; query: string; content: React.ReactNode }[] =>
  (keys ?? []).map((key) => ({
    value: key,
    query: DASHBOARD_DIMENSION_LABELS[key as keyof typeof DASHBOARD_DIMENSION_LABELS] ?? key,
    content: <span>{DASHBOARD_DIMENSION_LABELS[key as keyof typeof DASHBOARD_DIMENSION_LABELS] ?? key}</span>,
  }));

type Props = {
  card: TCardDefinition;
  preference: TCardPreference;
  onChange: (updates: Partial<TCardPreference>) => void;
  onReset: () => void;
};

/**
 * Rendered inside the card header. Collapsed to a single "Configure" button
 * until asked, so twelve cards do not ship twelve open control rows.
 */
export function WorkspaceDashboardCardControls({ card, preference, onChange, onReset }: Props) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (card.controls.length === 0) return null;

  const button = (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => setIsOpen((open) => !open)}
      data-testid={`dashboard-v3-configure-${card.id}`}
    >
      {t("dashboard_v3.card.configure")}
    </Button>
  );

  if (!isOpen) return button;

  const rows: { control: TCardControl; node: React.ReactNode }[] = [];

  if (card.controls.includes("metric")) {
    rows.push({
      control: "metric",
      node: (
        <CustomSearchSelect
          value={[preference.metric]}
          onChange={(value: string[]) => onChange({ metric: value[0] as TCardPreference["metric"] })}
          options={METRIC_OPTIONS(card.allowedMetrics)}
          label={t("dashboard_v3.control.metric")}
        />
      ),
    });
  }
  if (card.controls.includes("dimension")) {
    rows.push({
      control: "dimension",
      node: (
        <CustomSearchSelect
          value={preference.dimension ? [preference.dimension] : []}
          onChange={(value: string[]) => onChange({ dimension: (value[0] as TCardPreference["dimension"]) ?? null })}
          options={DIMENSION_OPTIONS(card.allowedDimensions)}
          label={t("dashboard_v3.control.dimension")}
        />
      ),
    });
  }
  if (card.controls.includes("breakdown")) {
    rows.push({
      control: "breakdown",
      node: (
        <CustomSearchSelect
          value={preference.breakdown ? [preference.breakdown] : []}
          onChange={(value: string[]) => onChange({ breakdown: (value[0] as TCardPreference["breakdown"]) ?? null })}
          options={DIMENSION_OPTIONS(card.allowedBreakdowns)}
          label={t("dashboard_v3.control.breakdown")}
        />
      ),
    });
  }
  if (card.controls.includes("display")) {
    rows.push({
      control: "display",
      node: (
        <CustomSearchSelect
          value={[preference.display]}
          onChange={(value: string[]) => onChange({ display: value[0] as TAnalyticsDisplay })}
          options={ANALYTICS_DISPLAY_OPTIONS.map((option) => ({
            value: option.value as string,
            query: option.label,
            content: <span>{option.label}</span>,
          }))}
          label={t("dashboard_v3.control.display")}
        />
      ),
    });
  }
  if (card.controls.includes("normalization")) {
    rows.push({
      control: "normalization",
      node: (
        <CustomSearchSelect
          value={[preference.normalization]}
          onChange={(value: string[]) => onChange({ normalization: value[0] as TAnalyticsNormalization })}
          options={ANALYTICS_NORMALIZATION_OPTIONS.map((option) => ({
            value: option.value as string,
            query: option.label,
            content: <span>{option.label}</span>,
          }))}
          label={t("dashboard_v3.control.normalization")}
        />
      ),
    });
  }
  if (card.controls.includes("allocation")) {
    rows.push({
      control: "allocation",
      node: (
        <CustomSearchSelect
          value={[preference.allocation]}
          onChange={(value: string[]) => onChange({ allocation: value[0] as TAnalyticsAllocation })}
          options={ANALYTICS_ALLOCATION_OPTIONS.map((option) => ({
            value: option.value as string,
            query: option.label,
            content: <span>{option.label}</span>,
          }))}
          label={t("dashboard_v3.control.allocation")}
        />
      ),
    });
  }
  if (card.controls.includes("date_grouping")) {
    rows.push({
      control: "date_grouping",
      node: (
        <CustomSearchSelect
          value={preference.dateGrouping ? [preference.dateGrouping] : []}
          onChange={(value: string[]) => onChange({ dateGrouping: (value[0] as TAnalyticsDateGrouping) ?? undefined })}
          options={ANALYTICS_DATE_GROUPING_OPTIONS.map((option) => ({
            value: option.value as string,
            query: option.label,
            content: <span>{option.label}</span>,
          }))}
          label={t("dashboard_v3.control.date_grouping")}
        />
      ),
    });
  }
  if (card.controls.includes("renderer")) {
    rows.push({
      control: "renderer",
      node: (
        <CustomSearchSelect
          value={[preference.renderer]}
          onChange={(value: string[]) => onChange({ renderer: value[0] as TCardRenderer })}
          options={card.allowedRenderers.map((renderer) => ({
            value: renderer,
            query: DASHBOARD_RENDERER_LABELS[renderer],
            content: <span>{DASHBOARD_RENDERER_LABELS[renderer]}</span>,
          }))}
          label={t("dashboard_v3.control.visualization")}
        />
      ),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid={`dashboard-v3-controls-${card.id}`} role="group">
      {rows.map((row) => (
        <div key={row.control} className="flex items-center gap-1">
          <span className="text-11 text-tertiary">{t(`dashboard_v3.control.${row.control}`)}</span>
          {row.node}
        </div>
      ))}
      <Button variant="tertiary" size="sm" onClick={onReset} data-testid={`dashboard-v3-reset-card-${card.id}`}>
        {t("dashboard_v3.control.reset_card")}
      </Button>
    </div>
  );
}

/** §8.2 — shown when a card pins its own date basis instead of the global one. */
export function CardDateBasisOverrideLabel({ card }: { card: TCardDefinition }) {
  const { t } = useTranslation();
  if (!card.semanticDateBasis) return null;
  // Surface the human-readable label (e.g. "Completed date") rather than the
  // raw engine token (`completed_at`) so the i18n string interpolates into a
  // sentence the viewer can actually read.
  const basisLabel =
    ANALYTICS_DATE_BASIS_OPTIONS.find((option) => option.value === card.semanticDateBasis)?.label ??
    card.semanticDateBasis;
  return (
    <span className="text-11 text-tertiary" data-testid={`dashboard-v3-basis-${card.id}`}>
      {t("dashboard_v3.card.basis_override", { basis: basisLabel })}
    </span>
  );
}
