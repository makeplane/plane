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

import { Schema } from "effect";

const ExportBaseFields = {
  pageId: Schema.NonEmptyTrimmedString,
  workspaceSlug: Schema.NonEmptyTrimmedString,
  projectId: Schema.optional(Schema.NonEmptyTrimmedString),
  teamspaceId: Schema.optional(Schema.NonEmptyTrimmedString),
  title: Schema.optional(Schema.String),
  author: Schema.optional(Schema.String),
  subject: Schema.optional(Schema.String),
  fileName: Schema.optional(Schema.String),
  noAssets: Schema.optional(Schema.Boolean),
};

export const PdfExportRequestBody = Schema.Struct({
  ...ExportBaseFields,
  format: Schema.optionalWith(Schema.Literal("pdf"), { default: () => "pdf" as const }),
  pageSize: Schema.optional(Schema.Literal("A4", "A3", "A2", "LETTER", "LEGAL", "TABLOID")),
  pageOrientation: Schema.optional(Schema.Literal("portrait", "landscape")),
});

export const DocxExportRequestBody = Schema.Struct({
  ...ExportBaseFields,
  format: Schema.Literal("docx"),
});

export const ExportRequestBody = Schema.Union(PdfExportRequestBody, DocxExportRequestBody);

export type TExportRequestBody = Schema.Schema.Type<typeof ExportRequestBody>;
export type TPdfExportRequestBody = Schema.Schema.Type<typeof PdfExportRequestBody>;
export type TDocxExportRequestBody = Schema.Schema.Type<typeof DocxExportRequestBody>;

export class ExportValidationError extends Schema.TaggedError<ExportValidationError>()("ExportValidationError", {
  message: Schema.NonEmptyTrimmedString,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class ExportAuthenticationError extends Schema.TaggedError<ExportAuthenticationError>()(
  "ExportAuthenticationError",
  {
    message: Schema.NonEmptyTrimmedString,
  }
) {}

export class ExportContentFetchError extends Schema.TaggedError<ExportContentFetchError>()("ExportContentFetchError", {
  message: Schema.NonEmptyTrimmedString,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class ExportMetadataFetchError extends Schema.TaggedError<ExportMetadataFetchError>()(
  "ExportMetadataFetchError",
  {
    message: Schema.NonEmptyTrimmedString,
    source: Schema.Literal("embeds", "mentions", "members", "subPages", "fetch-metadata"),
    cause: Schema.optional(Schema.Unknown),
  }
) {}

export class ExportImageProcessingError extends Schema.TaggedError<ExportImageProcessingError>()(
  "ExportImageProcessingError",
  {
    message: Schema.NonEmptyTrimmedString,
    assetId: Schema.NonEmptyTrimmedString,
    url: Schema.optional(Schema.NonEmptyTrimmedString),
    cause: Schema.optional(Schema.Unknown),
  }
) {}

export class ExportGenerationError extends Schema.TaggedError<ExportGenerationError>()("ExportGenerationError", {
  message: Schema.NonEmptyTrimmedString,
  format: Schema.NonEmptyTrimmedString,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class ExportTimeoutError extends Schema.TaggedError<ExportTimeoutError>()("ExportTimeoutError", {
  message: Schema.NonEmptyTrimmedString,
  operation: Schema.NonEmptyTrimmedString,
}) {}

export type ExportError =
  | ExportValidationError
  | ExportAuthenticationError
  | ExportContentFetchError
  | ExportMetadataFetchError
  | ExportImageProcessingError
  | ExportGenerationError
  | ExportTimeoutError;
