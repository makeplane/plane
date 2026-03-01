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
 * Enum defining the types of plans available in the external upgrade flow.
 * These represent different subscription tiers that users can purchase or upgrade to.
 */
export enum EExternalUpgradePlanType {
  PRO = "pro",
  BUSINESS = "business",
  ENTERPRISE = "enterprise",
}

/**
 * Enum defining the deployment types available in the external upgrade flow.
 * CLOUD: For upgrading existing workspaces in app.plane.so
 * SELF_HOSTED: For purchasing self-hosted licenses
 */
export enum EExternalUpgradeEditionType {
  CLOUD = "cloud",
  SELF_HOSTED = "self-hosted",
}

/**
 * The default plan type to show in the external upgrade flow.
 * Used as fallback when no specific plan is requested or when an invalid plan is provided.
 */
export const DEFAULT_EXTERNAL_UPGRADE_PLAN = EExternalUpgradePlanType.PRO;

/**
 * Array of plan types that are currently supported in the external upgrade flow.
 * Used to validate requested plan types and restrict access to plans that aren't fully implemented.
 */
export const SUPPORTED_EXTERNAL_UPGRADE_PLANS = [EExternalUpgradePlanType.PRO, EExternalUpgradePlanType.BUSINESS];

/**
 * Type guard to check if a value is a valid EExternalUpgradePlanType
 */
export const isExternalUpgradePlanType = (value: unknown): value is EExternalUpgradePlanType =>
  SUPPORTED_EXTERNAL_UPGRADE_PLANS.includes(value as EExternalUpgradePlanType);
