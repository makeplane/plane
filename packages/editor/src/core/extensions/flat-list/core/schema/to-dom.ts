import { type DOMOutputSpec, type Node as ProsemirrorNode } from "@tiptap/pm/model";

import { type ListAttributes } from "../types";

/** @public */
export interface ListToDOMOptions {
  /**
   * The list node to be rendered.
   */
  node: ProsemirrorNode;

  /**
   * If `true`, the list will be rendered as a native `<ul>` or `<ol>` element.
   * You might want to use {@link joinListElements} to join the list elements
   * afterward.
   *
   * @defaultValue false
   */
  nativeList?: boolean;

  /**
   * An optional function to get elements inside `<div class="list-marker">`.
   * Return `null` to hide the marker.
   */
  getMarkers?: (node: ProsemirrorNode) => DOMOutputSpec[] | null;

  /**
   * An optional function to get the attributes added to HTML element.
   */
  getAttributes?: (node: ProsemirrorNode) => Record<string, string | undefined>;
}

/**
 * Renders a list node to DOM output spec.
 *
 * @public @group Schema
 */
export function listToDOM({
  node,
  nativeList = false,
  getMarkers = defaultMarkerGetter,
  getAttributes = defaultAttributesGetter,
}: ListToDOMOptions): DOMOutputSpec {
  const attrs = node.attrs as ListAttributes;
  const markerHidden = node.firstChild?.type === node.type;
  const markers = markerHidden ? null : getMarkers(node);
  const domAttrs = getAttributes(node);
  const contentContainer: DOMOutputSpec = ["div", { class: "list-content" }, 0];
  const markerContainer: DOMOutputSpec | null = markers && [
    "div",
    {
      class: "list-marker list-marker-click-target",
      // Set `contenteditable` to `false` so that the cursor won't be
      // moved into the mark container when clicking on it.
      contenteditable: "false",
    },
    ...markers,
  ];

  if (nativeList) {
    const listTag = attrs.kind === "ordered" ? "ol" : "ul";
    if (markerContainer) {
      return [listTag, ["li", domAttrs, markerContainer, contentContainer]];
    } else {
      return [listTag, ["li", domAttrs, 0]];
    }
  } else {
    if (markerContainer) {
      return ["div", domAttrs, markerContainer, contentContainer];
    } else {
      return ["div", domAttrs, contentContainer];
    }
  }
}

/** @internal */
export function defaultMarkerGetter(node: ProsemirrorNode): DOMOutputSpec[] | null {
  const attrs = node.attrs as ListAttributes;
  switch (attrs.kind) {
    case "task":
      // Use a `label` element here so that the area around the checkbox is also checkable.
      return [["label", ["input", { type: "checkbox", checked: attrs.checked ? "" : undefined }]]];
    case "toggle":
      return [];
    default:
      return null;
  }
}

/** @internal */
export function defaultAttributesGetter(node: ProsemirrorNode) {
  const attrs = node.attrs as ListAttributes;
  const markerHidden = node.firstChild?.type === node.type;
  const markerType = markerHidden ? undefined : attrs.kind || "bullet";
  const domAttrs = {
    class: "prosemirror-flat-list",
    "data-list-kind": markerType,
    "data-list-order": attrs.order != null ? String(attrs.order) : undefined,
    "data-list-checked": attrs.checked ? "" : undefined,
    "data-list-collapsed": attrs.collapsed ? "" : undefined,
    "data-list-collapsable": node.childCount >= 2 ? "" : undefined,
    style: attrs.order != null ? `--prosemirror-flat-list-order: ${attrs.order};` : undefined,
  };

  return domAttrs;
}
