import { set } from "lodash-es";
import { TCustomerPayload, TCustomerRequest } from "@plane/types";

export function getChangedCustomerFields(
  formData: Partial<TCustomerPayload>,
  dirtyFields: { [key: string]: boolean | undefined }
) {
  const changedFields: Partial<TCustomerPayload> = {};

  const dirtyFieldKeys = Object.keys(dirtyFields) as (keyof TCustomerPayload)[];
  for (const dirtyField of dirtyFieldKeys) {
    if (!!dirtyFields[dirtyField]) {
      set(changedFields, [dirtyField], formData[dirtyField]);
    }
  }

  return changedFields;
}

export function getChangedRequestFields(
  formData: Partial<TCustomerRequest>,
  dirtyFields: { [key: string]: boolean | undefined }
) {
  const changedFields: Partial<TCustomerRequest> = {};

  const dirtyFieldKeys = Object.keys(dirtyFields) as (keyof TCustomerRequest)[];
  for (const dirtyField of dirtyFieldKeys) {
    if (!!dirtyFields[dirtyField]) {
      set(changedFields, [dirtyField], formData[dirtyField]);
    }
  }

  return changedFields;
}
