"use client";
import { Layers2, Layers3, ReceiptText } from "lucide-react";
// components
import {
  SelectPlaneProjectRoot,
  ConfigureClickUpRoot,
  MapStatesRoot,
  SummaryRoot,
  MapPriorityRoot,
} from "@/plane-web/components/importers/clickup";
// types
import { E_CLICKUP_IMPORTER_STEPS, TClickUpImporterStep } from "@/plane-web/types/importers/clickup";

export const IMPORTER_CLICKUP_STEPS_V1: TClickUpImporterStep[] = [
  {
    key: E_CLICKUP_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    icon: () => <Layers3 size={14} />,
    i18n_title: "clickup_importer.steps.title_configure_plane",
    i18n_description: "clickup_importer.steps.description_configure_plane",
    component: () => <SelectPlaneProjectRoot />,
    prevStep: undefined,
    nextStep: E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP,
  },
  {
    key: E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP,
    icon: () => <Layers2 size={14} />,
    i18n_title: "clickup_importer.steps.title_configure_clickup",
    i18n_description: "clickup_importer.steps.description_configure_clickup",
    component: () => <ConfigureClickUpRoot />,
    prevStep: E_CLICKUP_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    nextStep: E_CLICKUP_IMPORTER_STEPS.MAP_STATES,
  },
  {
    key: E_CLICKUP_IMPORTER_STEPS.MAP_STATES,
    icon: () => <Layers3 size={14} />,
    i18n_title: "clickup_importer.steps.title_map_states",
    i18n_description: "clickup_importer.steps.description_map_states",
    component: () => <MapStatesRoot />,
    prevStep: E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP,
    nextStep: E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES,
  },
  {
    key: E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES,
    icon: () => <Layers3 size={14} />,
    i18n_title: "clickup_importer.steps.title_map_priorities",
    i18n_description: "clickup_importer.steps.description_map_priorities",
    component: () => <MapPriorityRoot />,
    prevStep: E_CLICKUP_IMPORTER_STEPS.MAP_STATES,
    nextStep: E_CLICKUP_IMPORTER_STEPS.SUMMARY,
  },
  {
    key: E_CLICKUP_IMPORTER_STEPS.SUMMARY,
    icon: () => <ReceiptText size={14} />,
    i18n_title: "clickup_importer.steps.title_summary",
    i18n_description: "clickup_importer.steps.description_summary",
    component: () => <SummaryRoot />,
    prevStep: E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES,
    nextStep: E_CLICKUP_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
  },
];

export const IMPORTER_CLICKUP_STEPS: TClickUpImporterStep[] = [
  {
    key: E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP,
    icon: () => <Layers2 size={14} />,
    i18n_title: "clickup_importer.steps.title_configure_clickup",
    i18n_description: "clickup_importer.steps.description_configure_clickup",
    component: () => <ConfigureClickUpRoot />,
    prevStep: undefined,
    nextStep: E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES,
  },
  {
    key: E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES,
    icon: () => <Layers3 size={14} />,
    i18n_title: "clickup_importer.steps.title_map_priorities",
    i18n_description: "clickup_importer.steps.description_map_priorities",
    component: () => <MapPriorityRoot />,
    prevStep: E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP,
    nextStep: E_CLICKUP_IMPORTER_STEPS.SUMMARY,
  },
  {
    key: E_CLICKUP_IMPORTER_STEPS.SUMMARY,
    icon: () => <ReceiptText size={14} />,
    i18n_title: "clickup_importer.steps.title_summary",
    i18n_description: "clickup_importer.steps.description_summary",
    component: () => <SummaryRoot />,
    prevStep: E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES,
    nextStep: E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP,
  },
];
