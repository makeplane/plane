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
 * Input Validation Utilities
 * Following OWASP Input Validation best practices using allowlist approach
 *
 * Security: Blocks injection-risk characters: < > ' " % # { } [ ] * ^ !
 * These patterns are designed to prevent XSS, SQL injection, template injection,
 * and other security vulnerabilities while maintaining good UX
 */

// =============================================================================
// VALIDATION REGEX PATTERNS
// =============================================================================

/**
 * Person Name Pattern (for first_name, last_name)
 * Allows: Unicode letters (\p{L}), spaces, hyphens, apostrophes
 * Use case: Accommodates international names like "José", "李明", "محمد", "Müller"
 * Blocks: Injection-risk characters and special symbols
 */
export const PERSON_NAME_REGEX = /^[\p{L}\s'-]+$/u;

/**
 * Display Name Pattern (for display_name, usernames)
 * Allows: Unicode letters (\p{L}), numbers (\p{N}), underscore, period, hyphen
 * Use case: International usernames like "josé_123", "李明.dev", "müller-2024"
 * Blocks: Spaces and injection-risk characters
 */
export const DISPLAY_NAME_REGEX = /^[\p{L}\p{N}_.-]+$/u;

/**
 * Company/Organization Name Pattern (for company_name, workspace names)
 * Allows: Unicode letters (\p{L}), numbers (\p{N}), spaces, underscores, hyphens
 * Use case: International business names like "Société Générale", "株式会社", "Müller GmbH"
 * Blocks: Special punctuation and injection-risk chars
 */
export const COMPANY_NAME_REGEX = /^[\p{L}\p{N}\s_-]+$/u;

/**
 * URL Slug Pattern (for workspace slugs, URL-safe identifiers)
 * Allows: Unicode letters (\p{L}), numbers (\p{N}), underscores, hyphens
 * Use case: International URL-safe identifiers like "josé-workspace", "李明-project"
 * Blocks: Spaces and special characters (URL encoding will handle Unicode in actual URLs)
 */
export const SLUG_REGEX = /^[\p{L}\p{N}_-]+$/u;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * @description Validates person names (first name, last name)
 * @param {string} name - Name to validate
 * @returns {boolean | string} true if valid, error message if invalid
 * @example
 * validatePersonName("John") // returns true
 * validatePersonName("O'Brien") // returns true
 * validatePersonName("Jean-Paul") // returns true
 * validatePersonName("John<script>") // returns error message
 */
export const validatePersonName = (name: string): boolean | string => {
  if (!name || name.trim() === "") {
    return "Name is required";
  }

  if (name.length > 50) {
    return "Name must be 50 characters or less";
  }

  if (hasInjectionRiskChars(name)) {
    return "Names cannot contain special characters like < > ' \" { } [ ] * ^ ! # %";
  }

  if (!PERSON_NAME_REGEX.test(name)) {
    return "Names can only contain letters, spaces, hyphens, and apostrophes";
  }

  return true;
};

/**
 * @description Validates display names and usernames
 * @param {string} displayName - Display name to validate
 * @returns {boolean | string} true if valid, error message if invalid
 * @example
 * validateDisplayName("john_doe") // returns true
 * validateDisplayName("john.doe-123") // returns true
 * validateDisplayName("john doe") // returns error message (spaces not allowed)
 * validateDisplayName("john<>doe") // returns error message
 */
export const validateDisplayName = (displayName: string): boolean | string => {
  if (!displayName || displayName.trim() === "") {
    return true; // Display name is optional in most cases
  }

  if (displayName.length > 50) {
    return "Display name must be 50 characters or less";
  }

  if (hasInjectionRiskChars(displayName)) {
    return "Display name cannot contain special characters like < > ' \" { } [ ] * ^ ! # %";
  }

  if (!DISPLAY_NAME_REGEX.test(displayName)) {
    return "Display name can only contain letters, numbers, periods, hyphens, and underscores";
  }

  return true;
};

/**
 * @description Validates company and organization names
 * @param {string} companyName - Company name to validate
 * @param {boolean} required - Whether the field is required
 * @returns {boolean | string} true if valid, error message if invalid
 * @example
 * validateCompanyName("Acme Corp") // returns true
 * validateCompanyName("Acme_Corp-123") // returns true
 * validateCompanyName("Acme{Corp}") // returns error message
 */
export const validateCompanyName = (companyName: string, required: boolean = false): boolean | string => {
  if (!companyName || companyName.trim() === "") {
    return required ? "Company name is required" : true;
  }

  if (companyName.length > 80) {
    return "Company name must be 80 characters or less";
  }

  if (hasInjectionRiskChars(companyName)) {
    return "Company name cannot contain special characters like < > ' \" { } [ ] * ^ ! # %";
  }

  if (!COMPANY_NAME_REGEX.test(companyName)) {
    return "Company name can only contain letters, numbers, spaces, hyphens, and underscores";
  }

  return true;
};

/**
 * @description Validates company and organization names
 * @param {string} workspaceName - Workspace name to validate
 * @param {boolean} required - Whether the field is required
 * @returns {boolean | string} true if valid, error message if invalid
 * @example
 * validateWorkspaceName("Acme Corp") // returns true
 * validateWorkspaceName("Acme_Corp-123") // returns true
 * validateWorkspaceName("Acme{Corp}") // returns error message
 */
export const validateWorkspaceName = (workspaceName: string, required: boolean = false): boolean | string => {
  if (!workspaceName || workspaceName.trim() === "") {
    return required ? "Workspace name is required" : true;
  }

  if (workspaceName.length > 80) {
    return "Workspace name must be 80 characters or less";
  }

  if (hasInjectionRiskChars(workspaceName)) {
    return "Workspace name cannot contain special characters like < > ' \" { } [ ] * ^ ! # %";
  }

  if (!COMPANY_NAME_REGEX.test(workspaceName)) {
    return "Workspace name can only contain letters, numbers, spaces, hyphens, and underscores";
  }

  return true;
};

/**
 * @description Validates URL slugs and identifiers
 * @param {string} slug - Slug to validate
 * @returns {boolean | string} true if valid, error message if invalid
 * @example
 * validateSlug("my-workspace") // returns true
 * validateSlug("my_workspace_123") // returns true
 * validateSlug("my workspace") // returns error message (spaces not allowed)
 */
export const validateSlug = (slug: string): boolean | string => {
  if (!slug || slug.trim() === "") {
    return "Slug is required";
  }

  if (slug.length > 48) {
    return "Slug must be 48 characters or less";
  }

  if (hasInjectionRiskChars(slug)) {
    return "Slug cannot contain special characters like < > ' \" { } [ ] * ^ ! # %";
  }

  if (!SLUG_REGEX.test(slug)) {
    return "Slug can only contain letters, numbers, hyphens, and underscores";
  }

  return true;
};

/**
 * @description Checks if a string contains any injection-risk characters
 * @param {string} input - String to check
 * @returns {boolean} true if injection-risk characters found
 * @example
 * hasInjectionRiskChars("Hello World") // returns false
 * hasInjectionRiskChars("Hello<script>") // returns true
 */
export const hasInjectionRiskChars = (input: string): boolean => {
  const injectionRiskPattern = /[<>'"{}[\]*^!#%]/;
  return injectionRiskPattern.test(input);
};
