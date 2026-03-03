/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// assets
import SomethingWentWrongImage from "@/app/assets/something-went-wrong.svg?url";

function NotFound() {
  return (
    <div className="grid h-screen w-screen place-items-center bg-surface-1">
      <div className="text-center">
        <div className="mx-auto grid size-32 place-items-center rounded-full md:size-52">
          <div className="grid size-16 place-items-center md:size-32">
            <img src={SomethingWentWrongImage} alt="Something went wrong" width={128} height={128} />
          </div>
        </div>
        <h1 className="mt-8 text-18 font-semibold md:mt-12 md:text-24">That didn{"'"}t work</h1>
        <p className="mt-2 text-13 md:mt-4 md:text-14">
          Check the URL you are entering in the browser{"'"}s address bar and try again.
        </p>
      </div>
    </div>
  );
}

export default NotFound;
