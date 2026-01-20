import { Schema } from "effect";

export const PdfExportRequestBody = Schema.Struct({
  pageId: Schema.NonEmptyTrimmedString,
  workspaceSlug: Schema.NonEmptyTrimmedString,
  projectId: Schema.optional(Schema.NonEmptyTrimmedString),
  title: Schema.optional(Schema.String),
  author: Schema.optional(Schema.String),
  subject: Schema.optional(Schema.String),
  pageSize: Schema.optional(Schema.Literal("A4", "A3", "A2", "LETTER", "LEGAL", "TABLOID")),
  pageOrientation: Schema.optional(Schema.Literal("portrait", "landscape")),
  fileName: Schema.optional(Schema.String),
  noAssets: Schema.optional(Schema.Boolean),
});

export type TPdfExportRequestBody = Schema.Schema.Type<typeof PdfExportRequestBody>;

export class PdfValidationError extends Schema.TaggedError<PdfValidationError>()("PdfValidationError", {
  message: Schema.NonEmptyTrimmedString,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class PdfAuthenticationError extends Schema.TaggedError<PdfAuthenticationError>()("PdfAuthenticationError", {
  message: Schema.NonEmptyTrimmedString,
}) {}

export class PdfContentFetchError extends Schema.TaggedError<PdfContentFetchError>()("PdfContentFetchError", {
  message: Schema.NonEmptyTrimmedString,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class PdfMetadataFetchError extends Schema.TaggedError<PdfMetadataFetchError>()("PdfMetadataFetchError", {
  message: Schema.NonEmptyTrimmedString,
  source: Schema.Literal("user-mentions"),
  cause: Schema.optional(Schema.Unknown),
}) {}

export class PdfImageProcessingError extends Schema.TaggedError<PdfImageProcessingError>()("PdfImageProcessingError", {
  message: Schema.NonEmptyTrimmedString,
  assetId: Schema.NonEmptyTrimmedString,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class PdfGenerationError extends Schema.TaggedError<PdfGenerationError>()("PdfGenerationError", {
  message: Schema.NonEmptyTrimmedString,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class PdfTimeoutError extends Schema.TaggedError<PdfTimeoutError>()("PdfTimeoutError", {
  message: Schema.NonEmptyTrimmedString,
  operation: Schema.NonEmptyTrimmedString,
}) {}

export type PdfExportError =
  | PdfValidationError
  | PdfAuthenticationError
  | PdfContentFetchError
  | PdfMetadataFetchError
  | PdfImageProcessingError
  | PdfGenerationError
  | PdfTimeoutError;
