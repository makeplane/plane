import { type TagParseRule } from "@tiptap/pm/model";

import { type ListAttributes, type ListKind } from "../types";
import { parseInteger } from "../utils/parse-integer";

/**
 * Returns a set of rules for parsing HTML into ProseMirror list nodes.
 *
 * @public @group Schema
 */
export function createParseDomRules(): readonly TagParseRule[] {
  return [
    {
      tag: "div[data-list-kind]",
      getAttrs: (element): ListAttributes => {
        if (typeof element === "string") {
          return {};
        }

        return {
          kind: (element.getAttribute("data-list-kind") || "bullet") as ListKind,
          order: parseInteger(element.getAttribute("data-list-order")),
          checked: element.hasAttribute("data-list-checked"),
          collapsed: element.hasAttribute("data-list-collapsed"),
        };
      },
    },
    {
      tag: "div[data-list]",
      getAttrs: (element): ListAttributes => {
        if (typeof element === "string") {
          return {};
        }

        return {
          kind: (element.getAttribute("data-list-kind") || "bullet") as ListKind,
          order: parseInteger(element.getAttribute("data-list-order")),
          checked: element.hasAttribute("data-list-checked"),
          collapsed: element.hasAttribute("data-list-collapsed"),
        };
      },
    },
    {
      tag: "ul > li",
      getAttrs: (element): ListAttributes => {
        if (typeof element !== "string") {
          let checkbox = element.firstChild as HTMLElement | null;

          for (let i = 0; i < 3 && checkbox; i++) {
            if (["INPUT", "UL", "OL", "LI"].includes(checkbox.nodeName)) {
              break;
            }
            checkbox = checkbox.firstChild as HTMLElement | null;
          }

          if (checkbox && checkbox.nodeName === "INPUT" && checkbox.getAttribute("type") === "checkbox") {
            return {
              kind: "task",
              checked: checkbox.hasAttribute("checked"),
            };
          }

          if (element.hasAttribute("data-task-list-item") || element.getAttribute("data-list-kind") === "task") {
            return {
              kind: "task",
              checked: element.hasAttribute("data-list-checked") || element.hasAttribute("data-checked"),
            };
          }

          if (element.hasAttribute("data-toggle-list-item") || element.getAttribute("data-list-kind") === "toggle") {
            return {
              kind: "toggle",
              collapsed: element.hasAttribute("data-list-collapsed"),
            };
          }

          if (element.firstChild?.nodeType === 3 /* document.TEXT_NODE */) {
            const textContent = element.firstChild.textContent;
            if (textContent && /^\[[\sx|]]\s{1,2}/.test(textContent)) {
              element.firstChild.textContent = textContent.replace(/^\[[\sx|]]\s{1,2}/, "");
              return {
                kind: "task",
                checked: textContent.startsWith("[x]"),
              };
            }
          }
        }

        return {
          kind: "bullet",
        };
      },
    },
    {
      tag: "ol > li",
      getAttrs: (element): ListAttributes => {
        if (typeof element === "string") {
          return {
            kind: "ordered",
          };
        }

        return {
          kind: "ordered",
          order: parseInteger(element.getAttribute("data-list-order")),
        };
      },
    },
    {
      // This rule is for handling nested lists copied from Dropbox Paper. It's
      // technically invalid HTML structure.
      tag: ":is(ul, ol) > :is(ul, ol)",
      getAttrs: (): ListAttributes => {
        return {
          kind: "bullet",
        };
      },
    },
  ];
}
