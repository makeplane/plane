/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Hocuspocus } from "@hocuspocus/server";
import { describe, expect, it, vi } from "vitest";
import { drainCollaborationServer, withinShutdownDeadline } from "@/lib/drain-server";

function serverWithDocument() {
  const document = { name: "wiki" };
  const documents = new Map([[document.name, document]]);
  const events: string[] = [];
  const server = {
    documents,
    loadingDocuments: new Map(),
    unloadingDocuments: new Map(),
    closeConnections: vi.fn(() => {
      events.push("close");
    }),
    debouncer: {
      isCurrentlyExecuting: vi.fn(() => false),
      executeNow: vi.fn((_id: string) => {
        events.push("save");
        return Promise.resolve();
      }),
    },
    unloadDocument: vi.fn((_document: { name: string }) => {
      events.push("unload");
      documents.clear();
      return Promise.resolve();
    }),
    hooks: vi.fn(() => {
      events.push("destroy");
      return Promise.resolve();
    }),
  };
  return { server, events, instance: server as unknown as Hocuspocus };
}

describe("collaboration shutdown persistence", () => {
  it("flushes pending saves and unload hooks before destroying Redis extensions", async () => {
    const { server, events, instance } = serverWithDocument();
    await drainCollaborationServer(instance);
    expect(server.debouncer.executeNow).toHaveBeenCalledWith("onStoreDocument-wiki");
    expect(events).toEqual(["close", "save", "unload", "destroy"]);
  });

  it("does not tear down persistence dependencies when a save fails", async () => {
    const { server, instance } = serverWithDocument();
    server.debouncer.executeNow.mockRejectedValue(new Error("save failed"));
    await expect(drainCollaborationServer(instance)).rejects.toThrow(
      "Failed to persist 1 document(s) during shutdown: wiki"
    );
    expect(server.hooks).not.toHaveBeenCalled();
    expect(server.unloadDocument).not.toHaveBeenCalled();
  });

  it("keeps draining other documents when one save fails", async () => {
    const { server, events, instance } = serverWithDocument();
    server.documents.set("other", { name: "other" });
    server.debouncer.executeNow.mockImplementation((id: string) => {
      events.push(`save:${id}`);
      return id === "onStoreDocument-wiki" ? Promise.reject(new Error("save failed")) : Promise.resolve();
    });
    server.unloadDocument.mockImplementation((document: { name: string }) => {
      events.push(`unload:${document.name}`);
      server.documents.delete(document.name);
      return Promise.resolve();
    });
    await expect(drainCollaborationServer(instance)).rejects.toThrow(
      "Failed to persist 1 document(s) during shutdown: wiki"
    );
    expect(events).toContain("save:onStoreDocument-other");
    expect(events).toContain("unload:other");
    expect(events).not.toContain("unload:wiki");
    expect(server.hooks).not.toHaveBeenCalled();
  });

  it("times out even when a save never settles", async () => {
    const { server, instance } = serverWithDocument();
    server.debouncer.executeNow.mockImplementation(() => new Promise<void>(() => {}));
    await expect(drainCollaborationServer(instance, 20)).rejects.toThrow("shutdown timed out");
    expect(server.hooks).not.toHaveBeenCalled();
  });
});

describe("real Hocuspocus shutdown", () => {
  it("waits for an already running save with no timer before destroying extensions", async () => {
    let complete!: () => void;
    let started!: () => void;
    const saveStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    const onDestroy = vi.fn();
    const server = new Hocuspocus({
      quiet: true,
      onDestroy,
      onStoreDocument: async () => {
        started();
        await new Promise<void>((resolve) => {
          complete = resolve;
        });
      },
    });
    const direct = await server.openDirectConnection("wiki", {});
    const release = direct.disconnect();
    await saveStarted;
    expect(server.debouncer.isDebounced("onStoreDocument-wiki")).toBe(false);
    const draining = drainCollaborationServer(server, 1000);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onDestroy).not.toHaveBeenCalled();
    expect(server.documents.has("wiki")).toBe(true);
    complete();
    await Promise.all([release, draining]);
    expect(onDestroy).toHaveBeenCalledOnce();
    expect(server.documents.size).toBe(0);
  });

  it("bounds a stuck shutdown step with the overall deadline", async () => {
    await expect(withinShutdownDeadline(() => new Promise(() => {}), 20)).rejects.toThrow("shutdown timed out");
  });
});
