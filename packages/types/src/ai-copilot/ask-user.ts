/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TAskUserQuestionType =
  | "short_text"
  | "long_text"
  | "dropdown"
  | "multi_select"
  | "yes_no"
  | "number"
  | "date"
  | "ticket_picker"
  | "file_picker";

export type TAskUserOption = {
  value: string;
  label: string;
};

type TAskUserQuestionBase<T extends TAskUserQuestionType> = {
  id: string;
  type: T;
  label: string;
  description?: string;
  // A required question blocks submit until answered. An optional one can be left out of the answers.
  required: boolean;
  // When true the user can answer with an explicit "not sure" instead of a value.
  allow_not_sure: boolean;
};

export type TAskUserShortTextQuestion = TAskUserQuestionBase<"short_text"> & {
  placeholder?: string;
  max_length?: number;
};

export type TAskUserLongTextQuestion = TAskUserQuestionBase<"long_text"> & {
  placeholder?: string;
  max_length?: number;
};

export type TAskUserDropdownQuestion = TAskUserQuestionBase<"dropdown"> & {
  options: TAskUserOption[];
};

export type TAskUserMultiSelectQuestion = TAskUserQuestionBase<"multi_select"> & {
  options: TAskUserOption[];
  min_selections?: number;
  max_selections?: number;
};

export type TAskUserYesNoQuestion = TAskUserQuestionBase<"yes_no">;

export type TAskUserNumberQuestion = TAskUserQuestionBase<"number"> & {
  min?: number;
  max?: number;
  step?: number;
  integer_only?: boolean;
};

export type TAskUserDateQuestion = TAskUserQuestionBase<"date"> & {
  // ISO 8601 dates (YYYY-MM-DD).
  min_date?: string;
  max_date?: string;
};

export type TAskUserTicketPickerQuestion = TAskUserQuestionBase<"ticket_picker"> & {
  multiple: boolean;
};

export type TAskUserFilePickerQuestion = TAskUserQuestionBase<"file_picker"> & {
  multiple: boolean;
  // MIME types or extensions, for example "image/png" or ".pdf".
  accepted_types?: string[];
  max_files?: number;
  max_size_bytes?: number;
};

export type TAskUserQuestion =
  | TAskUserShortTextQuestion
  | TAskUserLongTextQuestion
  | TAskUserDropdownQuestion
  | TAskUserMultiSelectQuestion
  | TAskUserYesNoQuestion
  | TAskUserNumberQuestion
  | TAskUserDateQuestion
  | TAskUserTicketPickerQuestion
  | TAskUserFilePickerQuestion;

export type TAskUserArgs = {
  questions: TAskUserQuestion[];
};

// ticket_picker values are work item ids and file_picker values are uploaded asset ids.
export type TAskUserAnswerValueMap = {
  short_text: string;
  long_text: string;
  dropdown: string;
  multi_select: string[];
  yes_no: boolean;
  number: number;
  date: string;
  ticket_picker: string[];
  file_picker: string[];
};

export type TAskUserAnswer<T extends TAskUserQuestionType = TAskUserQuestionType> = {
  [K in T]: { not_sure: true; value?: undefined } | { not_sure?: false; value: TAskUserAnswerValueMap[K] };
}[T];

// Answers by question id. Optional questions that were skipped are absent.
export type TAskUserResponseData = {
  answers: Record<string, TAskUserAnswer>;
};

export type TAskUserResult = TAskUserResponseData;
