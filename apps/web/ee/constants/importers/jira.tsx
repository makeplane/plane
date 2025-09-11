"use client";

import { Layers2, Layers3, UsersRound, SignalHigh, ReceiptText } from "lucide-react";
// plane web components
import {
  SelectPlaneProjectRoot,
  ConfigureJiraRoot,
  ImportUsersFromJira,
  MapStatesRoot,
  MapPriorityRoot,
  SummaryRoot,
} from "@/plane-web/components/importers/jira";
// types
import { E_IMPORTER_STEPS, TImporterStep } from "@/plane-web/types/importers";

export const IMPORTER_STEPS: TImporterStep[] = [
  {
    key: E_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    icon: () => <Layers3 size={14} />,
    i18n_title: "jira_importer.steps.title_configure_plane",
    i18n_description: "jira_importer.steps.description_configure_plane",
    component: () => <SelectPlaneProjectRoot />,
    prevStep: undefined,
    nextStep: E_IMPORTER_STEPS.CONFIGURE_JIRA,
  },
  {
    key: E_IMPORTER_STEPS.CONFIGURE_JIRA,
    icon: () => <Layers2 size={14} />,
    i18n_title: "jira_importer.steps.title_configure_jira",
    i18n_description: "jira_importer.steps.description_configure_jira",
    component: () => <ConfigureJiraRoot />,
    prevStep: E_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    nextStep: E_IMPORTER_STEPS.IMPORT_USERS_FROM_JIRA,
  },
  {
    key: E_IMPORTER_STEPS.IMPORT_USERS_FROM_JIRA,
    icon: () => <UsersRound size={14} />,
    i18n_title: "jira_importer.steps.title_import_users",
    i18n_description: "jira_importer.steps.description_import_users",
    component: () => <ImportUsersFromJira />,
    prevStep: E_IMPORTER_STEPS.CONFIGURE_JIRA,
    nextStep: E_IMPORTER_STEPS.MAP_STATES,
  },
  {
    key: E_IMPORTER_STEPS.MAP_STATES,
    icon: () => <Layers3 size={14} />,
    i18n_title: "jira_importer.steps.title_map_states",
    i18n_description: "jira_importer.steps.description_map_states",
    component: () => <MapStatesRoot />,
    prevStep: E_IMPORTER_STEPS.IMPORT_USERS_FROM_JIRA,
    nextStep: E_IMPORTER_STEPS.MAP_PRIORITY,
  },
  {
    key: E_IMPORTER_STEPS.MAP_PRIORITY,
    icon: () => <SignalHigh size={14} />,
    i18n_title: "jira_importer.steps.title_map_priorities",
    i18n_description: "jira_importer.steps.description_map_priorities",
    component: () => <MapPriorityRoot />,
    prevStep: E_IMPORTER_STEPS.MAP_STATES,
    nextStep: E_IMPORTER_STEPS.SUMMARY,
  },
  {
    key: E_IMPORTER_STEPS.SUMMARY,
    icon: () => <ReceiptText size={14} />,
    i18n_title: "jira_importer.steps.title_summary",
    i18n_description: "jira_importer.steps.description_summary",
    component: () => <SummaryRoot />,
    prevStep: E_IMPORTER_STEPS.MAP_PRIORITY,
    nextStep: E_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
  },
];
