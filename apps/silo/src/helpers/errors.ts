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

import { AxiosError } from "axios";

function safeStringify(value: unknown): string {
  try {
    return typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
  } catch {
    return String(value);
  }
}

function extractMessageFromResponse(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }

  if (!data || typeof data !== "object") {
    return "";
  }

  const responseData = data as Record<string, unknown>;

  const message = responseData.message || responseData.error || responseData.errorMessages;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  if (typeof message === "object" && message !== null) {
    return safeStringify(message);
  }

  if (typeof message === "string") {
    return message;
  }

  if (responseData.errors) {
    const errors = responseData.errors;
    if (typeof errors === "object" && errors !== null) {
      if (Array.isArray(errors)) {
        return errors.map(safeStringify).join(", ");
      }
      return Object.entries(errors)
        .map(([field, value]) => `${field}: ${safeStringify(value)}`)
        .join(", ");
    }
  }

  return "";
}

export function extractErrorMetadata(error: unknown): {
  message: string;
  statusCode?: number;
  errorCode?: string;
  errorType?: string;
  payload?: object;
  request?: {
    url?: string;
    method?: string;
    params?: object;
    data?: object;
  };
  originalErrorType?: string;
} {
  const baseResult = {
    message: "",
    originalErrorType: error?.constructor?.name || typeof error,
  };

  if (error instanceof AxiosError) {
    const responseData = error.response?.data;
    let extractedMessage = extractMessageFromResponse(responseData);

    if (!extractedMessage) {
      extractedMessage = error.message || "Unknown axios error";
    }

    return {
      ...baseResult,
      message: extractedMessage,
      statusCode: error.response?.status,
      errorCode: responseData?.error?.code || responseData?.code,
      errorType: responseData?.error?.type || responseData?.type,
      payload: responseData && typeof responseData === "object" ? responseData : undefined,
      request: {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        data: error.config?.data,
      },
    };
  }

  if (error instanceof Error) {
    return {
      ...baseResult,
      message: error.message || safeStringify(error),
    };
  }

  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    return {
      ...baseResult,
      message: safeStringify(obj),
      payload: obj,
    };
  }

  return {
    ...baseResult,
    message: safeStringify(error),
  };
}
