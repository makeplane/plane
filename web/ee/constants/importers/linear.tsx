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
    title: "Configure Plane",
    description:
      "Please first create the project in Plane where you intend to migrate your Linear data. Once the project is created, select it here.",
    component: () => <SelectPlaneProjectRoot />,
    prevStep: undefined,
    nextStep: E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR,
  },
  {
    key: E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR,
    icon: () => <Layers2 size={14} />,
    title: "Configure Linear",
    description: "Please select the Linear team from which you want to migrate your data.",
    component: () => <ConfigureLinearRoot />,
    prevStep: E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    nextStep: E_LINEAR_IMPORTER_STEPS.MAP_STATES,
  },
  {
    key: E_LINEAR_IMPORTER_STEPS.MAP_STATES,
    icon: () => <Layers3 size={14} />,
    title: "Map states",
    description:
      "We have automatically matched the Linear statuses to Plane states to the best of our ability. Please map any remaining states before proceeding, you can also create states and map them manually.",
    component: () => <MapStatesRoot />,
    prevStep: E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR,
    nextStep: E_LINEAR_IMPORTER_STEPS.SUMMARY,
  },
  {
    key: E_LINEAR_IMPORTER_STEPS.SUMMARY,
    icon: () => <ReceiptText size={14} />,
    title: "Summary",
    description: "Here is a summary of the data that will be migrated from Linear to Plane.",
    component: () => <SummaryRoot />,
    prevStep: E_LINEAR_IMPORTER_STEPS.MAP_STATES,
    nextStep: E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
  },
];
