/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// assets
import SomethingWentWrongImage from "@/app/assets/something-went-wrong.svg?url";

export function SomethingWentWrongError() {
  return (
    <div className="grid min-h-screen w-full place-items-center bg-surface-1 p-6">
      <div className="text-center">
        <div className="mx-auto grid h-52 w-52 place-items-center rounded-full">
          <div className="grid h-32 w-32 place-items-center">
            <img
              src={SomethingWentWrongImage}
              alt="Упс! Что-то пошло не так"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
        <h1 className="mt-12 text-24 font-semibold">Упс! Что-то пошло не так.</h1>
        <p className="mt-4 text-tertiary">Публичная доска не существует. Проверьте URL.</p>
      </div>
    </div>
  );
}
