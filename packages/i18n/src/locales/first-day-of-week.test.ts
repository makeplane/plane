/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Spanish first-day-of-week copy includes the title, description, and all seven days", () => {
  const locale = JSON.parse(readFileSync(new URL("./es/settings.json", import.meta.url), "utf8"));
  const preference = locale.account_settings.preferences.first_day_of_week;

  assert.equal(preference.title, "Primer día de la semana");
  assert.match(preference.description, /calendarios/);
  assert.deepEqual(Object.values(preference.days), [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ]);
});
