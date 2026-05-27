/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const required = (name: string, fallback?: string): string => {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
};

export type SlackProviderConfig = {
  clientId: string;
  clientSecret: string;
  signingSecret: string;
  redirectUrl: string;
};

export type RuntimeConfig = {
  port: number;
  basePath: string;
  publicBaseUrl: string;
  env: string;
  hmacSecret: string;
  apiInternalBaseUrl: string;
  slack: SlackProviderConfig;
};

export const config = {
  port: Number(process.env.SILO_PORT ?? 3005),
  basePath: process.env.SILO_BASE_PATH ?? "/silo",
  publicBaseUrl: process.env.SILO_PUBLIC_BASE_URL ?? "http://localhost:3005",
  env: process.env.SILO_ENV ?? "dev",
  hmacSecret: required("SILO_HMAC_SECRET_KEY", "dev-insecure-silo-hmac"),
  apiInternalBaseUrl: process.env.API_INTERNAL_BASE_URL ?? "http://localhost:8800",
};

let slackConfig: SlackProviderConfig | null = null;

export const setSlackConfig = (s: SlackProviderConfig): void => {
  slackConfig = s;
};

export const getSlackConfig = (): SlackProviderConfig => {
  if (!slackConfig) throw new Error("Slack config not loaded yet");
  return slackConfig;
};
