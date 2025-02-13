"use client";
import { Layers2, Layers3, ReceiptText } from "lucide-react";
// components
import {
  SelectPlaneProjectRoot,
  ConfigureLinearRoot,
  MapStatesRoot,
  SummaryRoot,
} from "@/plane-web/components/importers/linear";
// types
import { E_LINEAR_IMPORTER_STEPS, TLinearImporterStep } from "@/plane-web/types/importers/linear";

export const IMPORTER_LINEAR_STEPS: TLinearImporterStep[] = [
  {
    key: E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    icon: () => <Layers3 size={14} />,
    i18n_title: "linear_importer.steps.title_configure_plane",
    i18n_description:"linear_importer.steps.description_configure_plane",
    component: () => <SelectPlaneProjectRoot />,
    prevStep: undefined,
    nextStep: E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR,
  },
  {
    key: E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR,
    icon: () => <Layers2 size={14} />,
    i18n_title: "linear_importer.steps.title_configure_linear",
    i18n_description: "linear_importer.steps.description_configure_linear",
    component: () => <ConfigureLinearRoot />,
    prevStep: E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    nextStep: E_LINEAR_IMPORTER_STEPS.MAP_STATES,
  },
  {
    key: E_LINEAR_IMPORTER_STEPS.MAP_STATES,
    icon: () => <Layers3 size={14} />,
    i18n_title: "linear_importer.steps.title_map_states",
    i18n_description:
      "linear_importer.steps.description_map_states",
    component: () => <MapStatesRoot />,
    prevStep: E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR,
    nextStep: E_LINEAR_IMPORTER_STEPS.SUMMARY,
  },
  {
    key: E_LINEAR_IMPORTER_STEPS.SUMMARY,
    icon: () => <ReceiptText size={14} />,
    i18n_title: "linear_importer.steps.title_summary",
    i18n_description: "linear_importer.steps.description_summary",
    component: () => <SummaryRoot />,
    prevStep: E_LINEAR_IMPORTER_STEPS.MAP_STATES,
    nextStep: E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
  },
];
