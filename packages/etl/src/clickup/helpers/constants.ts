import { TClickUpCustomFieldKeys } from "../types";
import { CLICKUP_SUPPORTED_CUSTOM_FIELD_ATTRIBUTES } from "./custom-field-etl";

export enum EClickUpPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export const CLICKUP_ALLOWED_CUSTOM_FIELD_TYPES: TClickUpCustomFieldKeys[] = Object.keys(
  CLICKUP_SUPPORTED_CUSTOM_FIELD_ATTRIBUTES
) as TClickUpCustomFieldKeys[];

export const CLICKUP_OPTION_CUSTOM_FIELD_TYPES: TClickUpCustomFieldKeys[] = ["drop_down", "labels"];
