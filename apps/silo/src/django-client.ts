/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * HMAC-signed client for silo → Django service-to-service calls.
 * Mirrors plane.connections.auth.SiloHMACAuthentication: signature
 * is hex(hmac_sha256(secret, "{ts}.{METHOD}.{path}.{sha256(body)}")).
 */

import { createHash, createHmac } from "node:crypto";

import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";

import { config } from "./config";

const sign = (method: string, path: string, body: string): { ts: string; sig: string } => {
  const ts = Math.floor(Date.now() / 1000).toString();
  const bodyHash = createHash("sha256").update(body).digest("hex");
  const msg = `${ts}.${method.toUpperCase()}.${path}.${bodyHash}`;
  const sig = createHmac("sha256", config.hmacSecret).update(msg).digest("hex");
  return { ts, sig };
};

export const callDjango = async <T = unknown>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<AxiosResponse<T>> => {
  const raw = body === undefined ? "" : JSON.stringify(body);
  const { ts, sig } = sign(method, path, raw);
  const opts: AxiosRequestConfig = {
    method,
    url: `${config.apiInternalBaseUrl}${path}`,
    headers: {
      "Content-Type": "application/json",
      "X-Silo-Timestamp": ts,
      "X-Silo-Signature": sig,
    },
    data: raw || undefined,
    transformRequest: [(d) => d],
    validateStatus: () => true,
  };
  return axios.request<T>(opts);
};
