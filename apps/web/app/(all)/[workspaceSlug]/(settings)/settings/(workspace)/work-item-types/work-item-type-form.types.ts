/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssueTypePropertyType, TLogoProps } from "@plane/types";

export type TWorkItemTypeFormProperty = {
  id: string;
  title: string;
  description: string;
  propertyType: TIssueTypePropertyType;
  isMandatory: boolean;
  isActive: boolean;
  options: string[];
  selectMode: "single" | "multi";
  defaultOption: string | null;
  defaultValue: string | boolean | null;
};

export type TWorkItemTypeFormFields = {
  name: string;
  description: string;
  logoProps: TLogoProps;
  isEpic: boolean;
  isActive: boolean;
  projectIds: string[];
  properties: TWorkItemTypeFormProperty[];
};

export const CUSTOM_PROPERTY_TYPES: TIssueTypePropertyType[] = [
  "text",
  "number",
  "dropdown",
  "boolean",
  "date",
  "member_picker",
];

export const DEFAULT_LOGO_PROPS: TLogoProps = {
  in_use: "icon",
  icon: {
    name: "layers",
    color: "#60646C",
    background_color: "#F9F9FB",
  },
};

export const DEFAULT_WORK_ITEM_TYPE_PROPERTY = (): TWorkItemTypeFormProperty => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  title: "",
  description: "",
  propertyType: "text",
  isMandatory: false,
  isActive: true,
  options: [],
  selectMode: "single",
  defaultOption: null,
  defaultValue: null,
});

export const DEFAULT_WORK_ITEM_TYPE_FORM: TWorkItemTypeFormFields = {
  name: "",
  description: "",
  logoProps: DEFAULT_LOGO_PROPS,
  isEpic: false,
  isActive: true,
  projectIds: [],
  properties: [],
};
