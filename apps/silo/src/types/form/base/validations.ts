import {
  FormField,
  TextField,
  SelectField,
  RelationField,
  DateField,
  NumberField,
  BooleanField,
  FileUploadField,
} from "./fields";

// Validation rules for different field types
export interface BaseValidation {
  required?: boolean;
}

export interface TextValidation extends BaseValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface NumberValidation extends BaseValidation {
  min?: number;
  max?: number;
  step?: number;
}

export interface DateValidation extends BaseValidation {
  minDate?: string;
  maxDate?: string;
}

export interface FileValidation extends BaseValidation {
  maxFiles?: number;
  maxFileSize?: string;
  allowedTypes?: string[];
}

// Union type for all validation types
export type FieldValidation = TextValidation | NumberValidation | DateValidation | FileValidation | BaseValidation;

// Type guards for runtime type checking
export const isTextField = (field: FormField): field is TextField => field.type === "TEXT";

export const isSelectField = (field: FormField): field is SelectField => field.type === "OPTION";

export const isRelationField = (field: FormField): field is RelationField => field.type === "RELATION";

export const isDateField = (field: FormField): field is DateField => field.type === "DATETIME";

export const isNumberField = (field: FormField): field is NumberField => field.type === "DECIMAL";

export const isBooleanField = (field: FormField): field is BooleanField => field.type === "BOOLEAN";

export const isFileUploadField = (field: FormField): field is FileUploadField => field.type === "FILE";
