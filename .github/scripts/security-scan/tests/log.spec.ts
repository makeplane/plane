import { afterEach, describe, expect, it, vi } from "vitest";
import { log } from "../lib/log";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("log", () => {
  it("writes informational messages to stdout", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    log.info("scan started");

    expect(spy).toHaveBeenCalledWith("scan started");
  });

  it("writes warnings to the warning channel", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    log.warn("skipping unreadable file");

    expect(spy).toHaveBeenCalledWith("skipping unreadable file");
  });

  it("writes errors to the error channel", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    log.error("scan failed");

    expect(spy).toHaveBeenCalledWith("scan failed");
  });
});
