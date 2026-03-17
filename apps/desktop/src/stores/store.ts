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

type Listener<T> = (state: T) => void;

export abstract class Store<T> {
  #listeners: Set<Listener<T>> = new Set();
  #state: T;

  constructor(initialState: T) {
    this.#state = initialState;
  }

  get state(): T {
    return this.#state;
  }

  protected set state(value: T) {
    this.#state = value;
    this.#notify();
  }

  subscribe(listener: Listener<T>): () => void {
    this.#listeners.add(listener);
    listener(this.#state); // Immediate call with current state
    return () => this.#listeners.delete(listener);
  }

  #notify(): void {
    for (const listener of this.#listeners) {
      listener(this.#state);
    }
  }
}
