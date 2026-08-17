/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TApiSchemaField = {
  type?: string;
  required?: boolean;
  note?: string;
  [key: string]: unknown;
};

export type TApiObjectDoc = {
  id?: string;
  name?: string;
  description?: string;
  method?: string;
  path?: string;
  querySchema?: Record<string, TApiSchemaField>;
  bodySchema?: Record<string, TApiSchemaField>;
  responseHints?: Record<string, unknown>;
  headersPolicy?: Record<string, unknown>;
  authPolicy?: Record<string, unknown>;
  asserts?: Array<Record<string, unknown>>;
  extracts?: Array<Record<string, unknown>>;
  recordedPath?: string;
  recordedQuery?: unknown;
  recordedBody?: unknown;
  recordedResponse?: unknown;
};

const FIELD_MAP: Array<[keyof TApiObjectDoc, string]> = [
  ["id", "id"],
  ["name", "name"],
  ["description", "description"],
  ["method", "method"],
  ["path", "path"],
  ["querySchema", "query_schema"],
  ["bodySchema", "body_schema"],
  ["responseHints", "response_hints"],
  ["headersPolicy", "headers_policy"],
  ["authPolicy", "auth_policy"],
  ["asserts", "asserts"],
  ["extracts", "extracts"],
  ["recordedPath", "_RECORDED_PATH"],
  ["recordedQuery", "_RECORDED_QUERY"],
  ["recordedBody", "_RECORDED_BODY"],
  ["recordedResponse", "_RECORDED_RESPONSE"],
];

export function parseApiObjectSource(source: string): TApiObjectDoc {
  const doc: TApiObjectDoc = {};
  for (const [key, pythonName] of FIELD_MAP) {
    const start = findAssignment(source, pythonName);
    if (start < 0) continue;
    try {
      const parser = new PythonLiteralParser(source, start);
      const value = parser.parseValue();
      (doc as Record<string, unknown>)[key] = value;
    } catch {
      // Skip fields that are not a Python literal we understand.
    }
  }
  if (typeof doc.method === "string") doc.method = doc.method.toUpperCase();
  return doc;
}

export function isSchemaMap(value: unknown): value is Record<string, TApiSchemaField> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function findAssignment(source: string, name: string): number {
  const pattern = new RegExp(`\\b${name}\\s*=`);
  const match = pattern.exec(source);
  if (!match) return -1;
  return match.index + match[0].length;
}

class PythonLiteralParser {
  constructor(
    private readonly source: string,
    private pos: number
  ) {}

  parseValue(): unknown {
    this.skipTrivia();
    const ch = this.source[this.pos];
    if (ch === undefined) throw new Error("unexpected end");
    if (ch === "{") return this.parseDict();
    if (ch === "[") return this.parseList();
    if (ch === '"' || ch === "'") return this.parseStringThenSuffix();
    if (ch === "-" || isDigit(ch)) return this.parseNumber();
    return this.parseIdent();
  }

  private parseDict(): Record<string, unknown> {
    this.expect("{");
    const result: Record<string, unknown> = {};
    while (true) {
      this.skipTrivia();
      if (this.peek() === "}") {
        this.pos += 1;
        break;
      }
      const key = this.parseDictKey();
      this.skipTrivia();
      this.expect(":");
      result[key] = this.parseValue();
      this.skipTrivia();
      if (this.peek() === ",") {
        this.pos += 1;
        continue;
      }
      this.expect("}");
      break;
    }
    return result;
  }

  private parseList(): unknown[] {
    this.expect("[");
    const result: unknown[] = [];
    while (true) {
      this.skipTrivia();
      if (this.peek() === "]") {
        this.pos += 1;
        break;
      }
      result.push(this.parseValue());
      this.skipTrivia();
      if (this.peek() === ",") {
        this.pos += 1;
        continue;
      }
      this.expect("]");
      break;
    }
    return result;
  }

  private parseDictKey(): string {
    this.skipTrivia();
    const ch = this.peek();
    if (ch === '"' || ch === "'") return this.parseString();
    const ident = this.readIdent();
    if (!ident) throw new Error("expected dict key");
    return ident;
  }

  private parseStringThenSuffix(): string {
    const value = this.parseString();
    this.skipTrivia();
    while (this.peek() === ".") {
      this.pos += 1;
      const method = this.readIdent();
      this.skipTrivia();
      if (this.peek() === "(") this.skipBalanced("(", ")");
      if (method === "strip") {
        /* already unquoted */
      }
      this.skipTrivia();
    }
    return value;
  }

  private parseString(): string {
    const quote = this.peek();
    if (quote !== '"' && quote !== "'") throw new Error("expected string");
    const triple = this.source.startsWith(quote.repeat(3), this.pos);
    this.pos += triple ? 3 : 1;
    let out = "";
    while (this.pos < this.source.length) {
      if (triple && this.source.startsWith(quote.repeat(3), this.pos)) {
        this.pos += 3;
        return out;
      }
      if (!triple && this.source[this.pos] === quote) {
        this.pos += 1;
        return out;
      }
      const ch = this.source[this.pos];
      if (ch === "\\" && this.pos + 1 < this.source.length) {
        const next = this.source[this.pos + 1];
        const escaped: Record<string, string> = {
          n: "\n",
          t: "\t",
          r: "\r",
          "\\": "\\",
          "'": "'",
          '"': '"',
        };
        out += escaped[next] ?? next;
        this.pos += 2;
        continue;
      }
      out += ch;
      this.pos += 1;
    }
    throw new Error("unterminated string");
  }

  private parseNumber(): number {
    const start = this.pos;
    if (this.peek() === "-") this.pos += 1;
    while (isDigit(this.peek())) this.pos += 1;
    if (this.peek() === ".") {
      this.pos += 1;
      while (isDigit(this.peek())) this.pos += 1;
    }
    return Number(this.source.slice(start, this.pos));
  }

  private parseIdent(): unknown {
    const ident = this.readIdent();
    if (ident === "True") return true;
    if (ident === "False") return false;
    if (ident === "None") return null;
    this.skipTrivia();
    if (this.peek() === "(") {
      const args = this.parseCallArgs();
      return { kind: ident, ...args };
    }
    return ident;
  }

  private parseCallArgs(): Record<string, unknown> {
    this.expect("(");
    const kwargs: Record<string, unknown> = {};
    let index = 0;
    while (true) {
      this.skipTrivia();
      if (this.peek() === ")") {
        this.pos += 1;
        break;
      }
      const start = this.pos;
      const ident = this.readIdent();
      this.skipTrivia();
      if (ident && this.peek() === "=") {
        this.pos += 1;
        kwargs[ident] = this.parseValue();
      } else {
        this.pos = start;
        kwargs[`arg${index}`] = this.parseValue();
        index += 1;
      }
      this.skipTrivia();
      if (this.peek() === ",") {
        this.pos += 1;
        continue;
      }
      this.expect(")");
      break;
    }
    return kwargs;
  }

  private skipBalanced(open: string, close: string) {
    this.expect(open);
    let depth = 1;
    while (this.pos < this.source.length && depth > 0) {
      const ch = this.source[this.pos];
      if (ch === '"' || ch === "'") {
        this.parseString();
        continue;
      }
      if (ch === open) depth += 1;
      if (ch === close) depth -= 1;
      this.pos += 1;
    }
  }

  private skipTrivia() {
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if (ch === "#") {
        while (this.pos < this.source.length && this.source[this.pos] !== "\n") this.pos += 1;
        continue;
      }
      if (/\s/.test(ch)) {
        this.pos += 1;
        continue;
      }
      break;
    }
  }

  private readIdent(): string {
    const start = this.pos;
    if (!this.peek() || !/[A-Za-z_]/.test(this.peek())) return "";
    this.pos += 1;
    while (this.pos < this.source.length && /[A-Za-z0-9_]/.test(this.source[this.pos])) this.pos += 1;
    return this.source.slice(start, this.pos);
  }

  private peek(): string {
    return this.source[this.pos] ?? "";
  }

  private expect(ch: string) {
    this.skipTrivia();
    if (this.source[this.pos] !== ch) throw new Error(`expected ${ch}`);
    this.pos += 1;
  }
}

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}
