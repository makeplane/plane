/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";

import { buildAgentEnv, isReservedEnvName } from "../src/env.ts";

const layout = { cwd: "/w/ws/u", home: "/w/.homes/ws/u", tmp: "/w/.tmp/ws/u", uid: 20_001, gid: 20_001 };

describe("buildAgentEnv", () => {
  it("starts from nothing: no runner env leaks into the agent", () => {
    process.env.AGENT_RUNNER_SECRET_FOR_TEST = "runner-secret";
    process.env.DATABASE_URL = "postgres://secret";
    try {
      const { env } = buildAgentEnv({
        agentEnv: { ANTHROPIC_API_KEY: "sk-ant", PLANE_AGENT_MODEL: "claude-opus-5-5" },
        layout,
        initialMode: "ask_all",
        path: "/usr/bin:/bin",
        shell: "/bin/bash",
      });
      expect(env).toEqual({
        PATH: "/usr/bin:/bin",
        HOME: layout.home,
        TMPDIR: layout.tmp,
        USER: "plane-agent-20001",
        LOGNAME: "plane-agent-20001",
        SHELL: "/bin/bash",
        LANG: "C.UTF-8",
        LC_ALL: "C.UTF-8",
        TERM: "dumb",
        PLANE_AGENT_DEFAULT_MODE: "ask_all",
        ANTHROPIC_API_KEY: "sk-ant",
        PLANE_AGENT_MODEL: "claude-opus-5-5",
      });
    } finally {
      delete process.env.AGENT_RUNNER_SECRET_FOR_TEST;
      delete process.env.DATABASE_URL;
    }
  });

  it("drops names that would override the base or inject code", () => {
    const hostile = {
      PATH: "/tmp/evil",
      HOME: "/root",
      NODE_OPTIONS: "--require /tmp/x.js",
      LD_PRELOAD: "/tmp/x.so",
      DYLD_INSERT_LIBRARIES: "/tmp/x",
      BASH_ENV: "/tmp/rc",
      PYTHONSTARTUP: "/tmp/x.py",
      GIT_SSH_COMMAND: "sh -c id",
      AGENT_RUNNER_SECRET: "x",
      PLANE_AGENT_DEFAULT_MODE: "yolo",
      lowercase: "x",
      OPENAI_API_KEY: "sk-ok",
    };
    const { env, dropped } = buildAgentEnv({
      agentEnv: hostile,
      layout,
      initialMode: "ask_writes",
      path: "/bin",
      shell: "/bin/sh",
    });
    expect(dropped.toSorted()).toEqual(
      Object.keys(hostile)
        .filter((k) => k !== "OPENAI_API_KEY")
        .toSorted()
    );
    expect(env.PATH).toBe("/bin");
    expect(env.HOME).toBe(layout.home);
    expect(env.PLANE_AGENT_DEFAULT_MODE).toBe("ask_writes");
    expect(env.OPENAI_API_KEY).toBe("sk-ok");
    expect(env.NODE_OPTIONS).toBeUndefined();
  });

  it("keeps the adapters' documented variables", () => {
    for (const name of [
      "ANTHROPIC_API_KEY",
      "CLAUDE_CODE_OAUTH_TOKEN",
      "OPENAI_API_KEY",
      "CODEX_HOME",
      "DEEPSEEK_API_KEY",
      "DEEPSEEK_BASE_URL",
      "PLANE_AGENT_MODEL",
      "PLANE_CODEX_TURN_TIMEOUT_MS",
      "PLANE_AGENT_MAX_ITERATIONS",
      "PLANE_ACP_MAX_MESSAGE_BYTES",
    ]) {
      expect(isReservedEnvName(name), name).toBe(false);
    }
  });
});
