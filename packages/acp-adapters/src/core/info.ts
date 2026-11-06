import type { Implementation } from "@agentclientprotocol/sdk";

import pkg from "../../package.json" with { type: "json" };

export const PACKAGE_VERSION: string = pkg.version;

export function agentInfo(name: string, title: string): Implementation {
  return { name, title, version: PACKAGE_VERSION };
}
