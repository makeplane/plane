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

/**
 * Function parameter definition
 */
export type FunctionParameter = {
  name: string;
  type: string; // TypeScript type string (e.g., "string", "number", "{ url: string }")
  description: string;
  required: boolean;
  defaultValue?: string;
};

/**
 * Function categories for organization
 */
export type FunctionCategory = "http" | "notifications" | "data" | "utils" | "custom";

/**
 * Script Function - a reusable code block with defined inputs/outputs
 */
export type ScriptFunction = {
  id: string;
  name: string; // e.g., "sendSlackMessage"
  description: string; // What the function does
  category: FunctionCategory;

  // Input/Output schema
  parameters: FunctionParameter[];
  return_type: string; // TypeScript type string

  // Implementation
  code: string; // Function body (async supported)

  // Usage
  usage_example: string; // Code snippet showing usage

  // Metadata
  is_system: boolean; // true = built-in, false = user-created
  workspace?: string | null; // null for system functions

  // Timestamps
  created_at: string;
  updated_at: string;
};

/**
 * Form data for creating/updating a function
 */
export type ScriptFunctionFormData = Omit<
  ScriptFunction,
  "id" | "workspace" | "is_system" | "created_at" | "updated_at"
>;

/**
 * Lite serializer for function lists
 */
export type ScriptFunctionLite = Omit<ScriptFunction, "code" | "created_at" | "updated_at">;

/**
 * Filters for listing functions
 */
export type ScriptFunctionFilters = {
  category?: FunctionCategory;
  is_system?: boolean;
  search?: string;
};
