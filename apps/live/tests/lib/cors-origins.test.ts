import { describe, expect, it } from "vitest";
import { parseAllowedOrigins } from "@/lib/cors-origins";

describe("parseAllowedOrigins", () => {
  // The bug this guards: "".split(",") is [""], not [], so an unset
  // CORS_ALLOWED_ORIGINS used to produce a one-element list. cors treats a
  // non-empty array as a configured origin list and answers OPTIONS itself,
  // instead of the `origin: false` the caller intended.
  it("returns an empty list when the value is unset", () => {
    expect(parseAllowedOrigins("")).toStrictEqual([]);
  });

  it("returns an empty list when the value is only separators or spaces", () => {
    expect(parseAllowedOrigins(",")).toStrictEqual([]);
    expect(parseAllowedOrigins("  ")).toStrictEqual([]);
    expect(parseAllowedOrigins(" , , ")).toStrictEqual([]);
  });

  it("parses a single origin", () => {
    expect(parseAllowedOrigins("https://plane.example.com")).toStrictEqual(["https://plane.example.com"]);
  });

  it("parses several origins and trims surrounding whitespace", () => {
    expect(parseAllowedOrigins(" https://a.example.com , https://b.example.com ")).toStrictEqual([
      "https://a.example.com",
      "https://b.example.com",
    ]);
  });

  it("drops empty entries from a trailing or doubled comma", () => {
    expect(parseAllowedOrigins("https://a.example.com,,https://b.example.com,")).toStrictEqual([
      "https://a.example.com",
      "https://b.example.com",
    ]);
  });
});
