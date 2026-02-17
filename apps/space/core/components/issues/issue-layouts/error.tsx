/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// assets
import SomethingWentWrongImage from "@/app/assets/something-went-wrong.svg?url";

export function SomethingWentWrongError() {
  return (
    <div className="bg-surface-1 grid min-h-screen w-full place-items-center p-6">
      <div className="text-center">
        <div className="mx-auto grid h-52 w-52 place-items-center rounded-full">
          <div className="grid h-32 w-32 place-items-center">
            <img
              src={SomethingWentWrongImage}
              alt="Oops! Something went wrong"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h1 className="mt-12 text-24 font-semibold">Oops! Something went wrong.</h1>
        <p className="mt-4 text-tertiary">The public board does not exist. Please check the URL.</p>
      </div>
    </div>
  );
}
