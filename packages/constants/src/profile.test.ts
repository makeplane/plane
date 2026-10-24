/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { START_OF_THE_WEEK_OPTIONS } from "./profile";

test("start-of-week options keep their saved values and point to weekday translations", () => {
  assert.deepEqual(
    START_OF_THE_WEEK_OPTIONS.map(({ value }) => value),
    [0, 1, 2, 3, 4, 5, 6]
  );
  assert.deepEqual(
    START_OF_THE_WEEK_OPTIONS.map(({ i18n_label }) => i18n_label),
    ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map(
      (day) => `account_settings.preferences.first_day_of_week.days.${day}`
    )
  );
});
