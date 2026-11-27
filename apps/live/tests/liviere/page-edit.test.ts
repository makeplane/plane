/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import {
  getAllDocumentFormatsFromDocumentEditorBinaryData,
  getBinaryDataFromDocumentEditorHTMLString,
} from "@plane/editor/lib";
import {
  CONTENT_FRAGMENT,
  TITLE_FRAGMENT,
  editDocument,
  editLoadedDocument,
  editStoredDocument,
} from "@/liviere/page-edit";

const docFrom = (state: Uint8Array) => {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, state);
  return doc;
};

const htmlOf = (doc: Y.Doc) =>
  getAllDocumentFormatsFromDocumentEditorBinaryData(Y.encodeStateAsUpdate(doc), false).contentHTML;

const textOf = (html: string) => html.replace(/<[^>]+>/g, "|").replace(/\|+/g, "|");

const titleOf = (doc: Y.Doc) =>
  doc
    .getXmlFragment(TITLE_FRAGMENT)
    .toString()
    .replace(/<[^>]+>/g, "");

const paragraphs = (doc: Y.Doc) => doc.getXmlFragment(CONTENT_FRAGMENT).toArray() as Y.XmlElement[];

const itemId = (element: Y.XmlElement) => {
  const id = element._item?.id;
  return id ? `${id.client}:${id.clock}` : null;
};

// A page as live stores it after the first open: content plus title fragment
const storedPage = (html: string, title: string) => getBinaryDataFromDocumentEditorHTMLString(html, title);

describe("liviere page edit", () => {
  it("replaces content and title of a stored document", () => {
    const state = storedPage("<p>One</p><p>Two</p>", "Old title");

    const result = editStoredDocument(state, {
      descriptionHtml: "<p>One</p><p>Two changed</p><p>Three</p>",
      name: "New title",
    });

    const edited = docFrom(Buffer.from(result.descriptionBinary, "base64"));
    expect(textOf(result.descriptionHtml)).toBe("|One|Two changed|Three|");
    expect(titleOf(edited)).toBe("New title");
    expect(result.descriptionJson).toMatchObject({ type: "doc" });
  });

  it("keeps the Yjs items of unchanged paragraphs", () => {
    const doc = docFrom(storedPage("<p>Keep me</p><p>Change me</p>", "Title"));
    const keptBefore = itemId(paragraphs(doc)[0]);

    editDocument(doc, { descriptionHtml: "<p>Keep me</p><p>Changed</p>" });

    expect(itemId(paragraphs(doc)[0])).toBe(keptBefore);
    expect(textOf(htmlOf(doc))).toBe("|Keep me|Changed|");
  });

  it("changes only the title when only the name is given", () => {
    const doc = docFrom(storedPage("<p>Body</p>", "Old"));
    const contentBefore = htmlOf(doc);

    editDocument(doc, { name: "Renamed" });

    expect(titleOf(doc)).toBe("Renamed");
    expect(htmlOf(doc)).toBe(contentBefore);
  });

  it("fills an empty title fragment", () => {
    const doc = docFrom(storedPage("<p>Body</p>", undefined as unknown as string));
    expect(doc.getXmlFragment(TITLE_FRAGMENT).length).toBe(0);

    editDocument(doc, { name: "First title" });

    expect(titleOf(doc)).toBe("First title");
  });

  it("merges into a stale cached copy without duplicating content", () => {
    const state = storedPage("<p>Alpha</p><p>Beta</p>", "Old");
    // A browser that opened the page before keeps this state in y-indexeddb
    const cachedCopy = docFrom(state);

    const result = editStoredDocument(state, { descriptionHtml: "<p>Alpha</p><p>Gamma</p>", name: "New" });

    // Reopening the page: the provider syncs the stored state into the cached document
    Y.applyUpdate(cachedCopy, Buffer.from(result.descriptionBinary, "base64"));
    expect(textOf(htmlOf(cachedCopy))).toBe("|Alpha|Gamma|");
    expect(titleOf(cachedCopy)).toBe("New");
  });

  it("merges with a concurrent edit made in another paragraph", () => {
    const state = storedPage("<p>Human</p><p>Api</p>", "Title");
    const human = docFrom(state);
    const server = docFrom(state);

    // The human types in the first paragraph while the API rewrites the second one
    const firstText = paragraphs(human)[0].get(0) as Y.XmlText;
    firstText.insert(firstText.length, " typed");
    const result = editDocument(server, { descriptionHtml: "<p>Human</p><p>Api rewritten</p>" });

    Y.applyUpdate(human, Buffer.from(result.update, "base64"));
    Y.applyUpdate(server, Y.encodeStateAsUpdate(human));
    expect(textOf(htmlOf(human))).toBe("|Human typed|Api rewritten|");
    expect(htmlOf(server)).toBe(htmlOf(human));
  });

  it("returns an incremental update that reproduces the edit", () => {
    const state = storedPage("<p>Before</p>", "T");
    const replica = docFrom(state);

    const result = editStoredDocument(state, { descriptionHtml: "<p>After</p>" });
    Y.applyUpdate(replica, Buffer.from(result.update, "base64"));

    expect(textOf(htmlOf(replica))).toBe("|After|");
  });

  it("keeps unsaved typing of an open editor, also in the paragraph the API changes", () => {
    const stored = storedPage("<p>Human</p><p>Api</p>", "Title");
    // live has the page open: stored state plus typing that is not stored yet
    const loaded = docFrom(stored);
    const [first, second] = paragraphs(loaded).map((element) => element.get(0) as Y.XmlText);
    first.insert(first.length, " typed");
    second.insert(0, "Hi ");

    const result = editLoadedDocument(loaded, stored, { descriptionHtml: "<p>Human</p><p>Api rewritten</p>" });

    expect(textOf(htmlOf(loaded))).toBe("|Human typed|Hi Api rewritten|");
    expect(textOf(result.descriptionHtml)).toBe("|Human typed|Hi Api rewritten|");
    // An editor that only had the stored state converges to the same content with the update
    const editor = docFrom(stored);
    Y.applyUpdate(editor, Buffer.from(result.update, "base64"));
    Y.applyUpdate(editor, Y.encodeStateAsUpdate(loaded));
    expect(htmlOf(editor)).toBe(htmlOf(loaded));
  });
});
