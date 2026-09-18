import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_TIMEZONE } from "../../../packages/constants/src/timezone.ts";

describe("DEFAULT_TIMEZONE", () => {
  it("uses the canonical IANA identifier for China Standard Time", () => {
    assert.equal(DEFAULT_TIMEZONE, "Asia/Shanghai");
  });

  it("formats independently of the process timezone", () => {
    const instant = new Date("2026-09-18T00:24:00.000Z");
    const formatted = new Intl.DateTimeFormat("en-GB", {
      timeZone: DEFAULT_TIMEZONE,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
    }).format(instant);

    assert.equal(formatted, "08:24");
  });
});
