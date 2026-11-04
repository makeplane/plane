/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { csvDownload } from "./file";

vi.mock("@plane/constants", () => ({ API_BASE_URL: "" }));

afterEach(() => vi.unstubAllGlobals());

async function download(data: string[][] | Record<string, string>) {
  const link = { href: "", download: "", click: vi.fn() };
  const appendChild = vi.fn();
  const removeChild = vi.fn();
  vi.stubGlobal("document", {
    createElement: vi.fn(() => link),
    body: { appendChild, removeChild },
  });
  csvDownload(data, "export");
  expect(link.download).toBe("export.csv");
  expect(link.click).toHaveBeenCalledOnce();
  expect(appendChild).toHaveBeenCalledWith(link);
  expect(removeChild).toHaveBeenCalledWith(link);
  return (await fetch(link.href)).text();
}

describe("csvDownload", () => {
  it("keeps ordinary object headers and values", async () => {
    expect(await download({ Title: "Build", "Secret key": "fake-token" })).toBe("Title,Secret key\nBuild,fake-token");
  });
  it("preserves a hash and subsequent secret-key columns", async () => {
    expect(await download({ Title: "Build #42", "Secret key": "fake-token" })).toBe(
      "Title,Secret key\nBuild #42,fake-token"
    );
  });
  it("quotes commas so user labels do not shift columns", async () => {
    expect(await download({ Title: "Build, deploy", "Secret key": "fake-token" })).toBe(
      'Title,Secret key\n"Build, deploy",fake-token'
    );
  });
  it("doubles quotes in quoted cells", async () => {
    expect(await download([['A "quoted" label', "value"]])).toBe('"A ""quoted"" label",value');
  });
  it.each(["\n", "\r", "\r\n"])("quotes embedded %j line endings", async (separator) => {
    expect(await download([[`first${separator}second`, "value"]])).toBe(`"first${separator}second",value`);
  });
  it("preserves Unicode and URI-special characters", async () => {
    expect(await download([["日本語 # % & ? + =", "last"]])).toBe("日本語 # % & ? + =,last");
  });
  it("escapes object headers as well as values", async () => {
    expect(await download({ "a,b": 'c"d' })).toBe('"a,b"\n"c""d"');
  });
  it("preserves empty cells and input data", async () => {
    const rows = [
      ["", "last"],
      ["first", ""],
    ];
    expect(await download(rows)).toBe(",last\nfirst,");
    expect(rows).toEqual([
      ["", "last"],
      ["first", ""],
    ]);
  });
});
