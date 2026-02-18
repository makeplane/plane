/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import "reflect-metadata";

/**
 * WebSocket method decorator
 * @param route
 * @returns
 */
export function WebSocket(route: string): MethodDecorator {
  return function (target: object, propertyKey: string | symbol) {
    Reflect.defineMetadata("method", "ws", target, propertyKey);
    Reflect.defineMetadata("route", route, target, propertyKey);
  };
}
