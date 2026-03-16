/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { makeObservable, observable } from "mobx";

export interface IWorkspaceStore {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export class WorkspaceStore implements IWorkspaceStore {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;

  constructor(data: IWorkspaceStore) {
    makeObservable(this, {
      id: observable.ref,
      name: observable.ref,
      createdAt: observable.ref,
      updatedAt: observable.ref,
    });
    this.id = data.id;
    this.name = data.name;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
