/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { EventEmitter } from "node:events";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { Doc } from "yjs";
import { useYjsSetup } from "../use-yjs-setup";

interface TestProvider extends EventEmitter {
  document: Doc;
  configuration: {
    websocketProvider: {
      shouldConnect: boolean;
      disconnect: Mock;
      connect: Mock;
    };
  };
  destroy: Mock;
}

const testState = vi.hoisted(() => ({ providers: [] as TestProvider[] }));

vi.mock("@hocuspocus/provider", async () => {
  const { EventEmitter } = await import("node:events");
  const { Doc } = await import("yjs");
  return {
    HocuspocusProvider: class extends EventEmitter {
      document = new Doc();
      configuration = {
        websocketProvider: { shouldConnect: true, disconnect: vi.fn(), connect: vi.fn() },
      };
      destroy = vi.fn(() => {
        this.document.destroy();
        this.removeAllListeners();
      });

      constructor() {
        super();
        testState.providers.push(this);
      }
    },
  };
});

vi.mock("y-indexeddb", () => ({
  IndexeddbPersistence: class {
    on = vi.fn();
    off = vi.fn();
    destroy = vi.fn();
  },
}));

let root: Root;
let container: HTMLDivElement;
let session: ReturnType<typeof useYjsSetup>;

function Harness({ docId }: { docId: string }) {
  session = useYjsSetup({ docId, serverUrl: "ws://localhost/live", authToken: "test-token" });
  return null;
}

beforeEach(async () => {
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  testState.providers.length = 0;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(() => root.render(createElement(Harness, { docId: "wiki" })));
});

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

describe("collaboration forced disconnection", () => {
  it.each(["document_too_large", "admin_request"])(
    "stops reconnecting after a %s message followed by a v3 close event",
    async (reason) => {
      const provider = testState.providers[0];
      await act(() => {
        provider.emit("stateless", { payload: JSON.stringify({ type: "force_close", reason, code: 4001 }) });
        provider.emit("close", { event: { code: 1000, reason } });
      });

      expect(session?.state.stage).toMatchObject({ kind: "disconnected", error: { type: "forced-close" } });
      expect(session?.state.isServerDisconnected).toBe(true);
      expect(provider.configuration.websocketProvider.shouldConnect).toBe(false);
      expect(provider.configuration.websocketProvider.disconnect).toHaveBeenCalledOnce();
    }
  );

  it.each(["lock", "null", '"force_close"', "[]", '{"action":"error"}', '{"type":"property_updated"}'])(
    "keeps transient-close retries after an unrelated or non-JSON stateless payload: %s",
    async (payload) => {
      const provider = testState.providers[0];
      await act(() => {
        provider.emit("stateless", { payload });
        provider.emit("close", { event: { code: 1006 } });
      });

      expect(session?.state.stage).toEqual({ kind: "reconnecting", attempt: 1 });
      expect(provider.configuration.websocketProvider.shouldConnect).toBe(true);
      expect(provider.configuration.websocketProvider.disconnect).not.toHaveBeenCalled();
    }
  );

  it("removes the listener and clears a pending forced-close signal when switching documents", async () => {
    const previousProvider = testState.providers[0];
    const off = vi.spyOn(previousProvider, "off");
    await act(() => {
      previousProvider.emit("stateless", { payload: '{"type":"force_close"}' });
      root.render(createElement(Harness, { docId: "another-wiki" }));
    });

    expect(off).toHaveBeenCalledWith("stateless", expect.any(Function));
    expect(previousProvider.destroy).toHaveBeenCalledOnce();

    const provider = testState.providers[1];
    await act(() => {
      provider.emit("close", { event: { code: 1006 } });
    });
    expect(session?.state.stage).toEqual({ kind: "reconnecting", attempt: 1 });
    expect(provider.configuration.websocketProvider.shouldConnect).toBe(true);
  });
});
