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

import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import type { TIntakeTypeForm } from "@plane/types";

export interface IIntakeTypeFormInstance {
  id: string;
  name: string;
  work_item_type: string;
  form_fields: string[];
  is_active: boolean;
  description?: string;
  anchor?: string;
  is_workitem_name_required?: boolean;
  is_workitem_description_required?: boolean;
  mutateInstance: (data: Partial<TIntakeTypeForm>) => void;
  update: () => Promise<TIntakeTypeForm>;
}

export class IntakeTypeFormInstance implements IIntakeTypeFormInstance {
  // observables
  id: string;
  name: string;
  form_fields: string[] = [];
  is_active: boolean;
  description?: string;
  anchor?: string;
  work_item_type: string;
  is_workitem_name_required?: boolean;
  is_workitem_description_required?: boolean;

  // services
  updateCallback: (data: Partial<TIntakeTypeForm>) => Promise<TIntakeTypeForm>;

  constructor(data: TIntakeTypeForm, updateCallback: (data: Partial<TIntakeTypeForm>) => Promise<TIntakeTypeForm>) {
    this.id = data.id;
    this.name = data.name;
    this.work_item_type = data.work_item_type;
    this.form_fields = data.form_fields;
    this.is_active = data.is_active ?? false;
    this.description = data.description;
    this.anchor = data.anchor;
    this.is_workitem_name_required = data.is_workitem_name_required ?? true;
    this.is_workitem_description_required = data.is_workitem_description_required ?? true;

    // services
    this.updateCallback = updateCallback;

    makeObservable(this, {
      // observables
      id: observable,
      work_item_type: observable,
      form_fields: observable,
      is_active: observable,
      description: observable,
      anchor: observable,
      is_workitem_name_required: observable,
      is_workitem_description_required: observable,
      // actions
      mutateInstance: action,
      update: action,
    });
  }

  get asJSON(): TIntakeTypeForm {
    return {
      id: this.id,
      name: this.name,
      work_item_type: this.work_item_type,
      form_fields: this.form_fields,
      is_active: this.is_active,
      description: this.description,
      anchor: this.anchor,
      is_workitem_name_required: this.is_workitem_name_required,
      is_workitem_description_required: this.is_workitem_description_required,
    };
  }

  // actions
  mutateInstance = (data: Partial<TIntakeTypeForm>) => {
    runInAction(() => {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const keyType = key as keyof TIntakeTypeForm;
          set(this, keyType, data[keyType]);
        }
      }
    });
  };

  update = async () => {
    try {
      const typeForm = await this.updateCallback({
        ...this.asJSON,
      });
      this.mutateInstance(typeForm);
      return typeForm;
    } catch (error) {
      console.error("Error updating type form", error);
      throw error;
    }
  };
}
