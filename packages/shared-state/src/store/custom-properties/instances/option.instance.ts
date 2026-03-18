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

import { action, computed, makeObservable, observable, runInAction } from "mobx";
import type { CustomPropertyOptionsInstanceSchema, CustomPropertyOption } from "@plane/types";
import { set } from "lodash-es";

export class CustomPropertyOptionsInstance implements CustomPropertyOptionsInstanceSchema {
  created_at: CustomPropertyOption["created_at"];
  created_by: CustomPropertyOption["created_by"];
  description: CustomPropertyOption["description"];
  id: CustomPropertyOption["id"];
  is_active: CustomPropertyOption["is_active"];
  is_default: CustomPropertyOption["is_default"];
  logo_props: CustomPropertyOption["logo_props"];
  name: CustomPropertyOption["name"];
  parent: CustomPropertyOption["parent"];
  property_id: CustomPropertyOption["property_id"];
  sort_order: CustomPropertyOption["sort_order"];
  updated_at: CustomPropertyOption["updated_at"];
  updated_by: CustomPropertyOption["updated_by"];

  constructor(data: CustomPropertyOption) {
    this.created_at = data.created_at;
    this.created_by = data.created_by;
    this.description = data.description;
    this.id = data.id;
    this.is_active = data.is_active;
    this.is_default = data.is_default;
    this.logo_props = data.logo_props;
    this.name = data.name;
    this.parent = data.parent;
    this.property_id = data.property_id;
    this.sort_order = data.sort_order;
    this.updated_at = data.updated_at;
    this.updated_by = data.updated_by;

    makeObservable(this, {
      created_at: observable.ref,
      created_by: observable.ref,
      description: observable.ref,
      id: observable.ref,
      is_active: observable.ref,
      is_default: observable.ref,
      logo_props: observable,
      name: observable.ref,
      parent: observable.ref,
      property_id: observable.ref,
      sort_order: observable.ref,
      updated_at: observable.ref,
      updated_by: observable.ref,
      // computed
      asJSON: computed,
      // actions
      mutateProperties: action,
    });
  }

  get asJSON(): CustomPropertyOption {
    return {
      created_at: this.created_at,
      created_by: this.created_by,
      description: this.description,
      id: this.id,
      is_active: this.is_active,
      is_default: this.is_default,
      logo_props: this.logo_props,
      name: this.name,
      parent: this.parent,
      property_id: this.property_id,
      sort_order: this.sort_order,
      updated_at: this.updated_at,
      updated_by: this.updated_by,
    };
  }

  mutateProperties: CustomPropertyOptionsInstanceSchema["mutateProperties"] = (data) => {
    runInAction(() => {
      for (const key in data) {
        if (Object.hasOwn(data, key)) {
          const typedKey = key as keyof CustomPropertyOption;
          set(this, typedKey, data[typedKey]);
        }
      }
    });
  };
}
