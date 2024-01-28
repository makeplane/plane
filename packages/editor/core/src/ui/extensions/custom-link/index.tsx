import { Mark, markPasteRule, mergeAttributes } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { find, registerCustomProtocol, reset } from "linkifyjs";

import { autolink } from "src/ui/extensions/custom-link/helpers/autolink";
import { clickHandler } from "src/ui/extensions/custom-link/helpers/clickHandler";
import { pasteHandler } from "src/ui/extensions/custom-link/helpers/pasteHandler";

export interface LinkProtocolOptions {
  scheme: string;
  optionalSlashes?: boolean;
}

export interface LinkOptions {
  autolink: boolean;
  inclusive: boolean;
  protocols: Array<LinkProtocolOptions | string>;
  openOnClick: boolean;
  linkOnPaste: boolean;
  HTMLAttributes: Record<string, any>;
  validate?: (url: string) => boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    link: {
      setLink: (attributes: {
        href: string;
        target?: string | null;
        rel?: string | null;
        class?: string | null;
      }) => ReturnType;
      toggleLink: (attributes: {
        href: string;
        target?: string | null;
        rel?: string | null;
        class?: string | null;
      }) => ReturnType;
      unsetLink: () => ReturnType;
    };
  }
}

export const CustomLinkExtension = Mark.create<LinkOptions>({
  name: "link",

  priority: 1000,

  keepOnSplit: false,

  onCreate() {
    this.options.protocols.forEach((protocol) => {
      if (typeof protocol === "string") {
        registerCustomProtocol(protocol);
        return;
      }
      registerCustomProtocol(protocol.scheme, protocol.optionalSlashes);
    });
  },

  onDestroy() {
    reset();
  },

  inclusive() {
    return this.options.inclusive;
  },

  addOptions() {
    return {
      openOnClick: true,
      linkOnPaste: true,
      autolink: true,
      inclusive: false,
      protocols: [],
      HTMLAttributes: {
        target: "_blank",
        rel: "noopener noreferrer nofollow",
        class: null,
      },
      validate: undefined,
    };
  },

  addAttributes() {
    return {
      href: {
        default: null,
      },
      target: {
        default: this.options.HTMLAttributes.target,
      },
      rel: {
        default: this.options.HTMLAttributes.rel,
      },
      class: {
        default: this.options.HTMLAttributes.class,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "a[href]",
        getAttrs: (node) => {
          if (typeof node === "string" || !(node instanceof HTMLElement)) {
            return null;
          }
          const href = node.getAttribute("href")?.toLowerCase() || "";
          if (href.startsWith("javascript:") || href.startsWith("data:") || href.startsWith("vbscript:")) {
            return false;
          }
          return {};
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const href = HTMLAttributes.href?.toLowerCase() || "";
    if (href.startsWith("javascript:") || href.startsWith("data:") || href.startsWith("vbscript:")) {
      return ["a", mergeAttributes(this.options.HTMLAttributes, { ...HTMLAttributes, href: "" }), 0];
    }
    return ["a", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setLink:
        (attributes) =>
        ({ chain }) =>
          chain().setMark(this.name, attributes).setMeta("preventAutolink", true).run(),

      toggleLink:
        (attributes) =>
        ({ chain }) =>
          chain()
            .toggleMark(this.name, attributes, { extendEmptyMarkRange: true })
            .setMeta("preventAutolink", true)
            .run(),

      unsetLink:
        () =>
        ({ chain }) =>
          chain().unsetMark(this.name, { extendEmptyMarkRange: true }).setMeta("preventAutolink", true).run(),
    };
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: (text) =>
          find(text)
            .filter((link) => {
              if (this.options.validate) {
                return this.options.validate(link.value);
              }
              return true;
            })
            .filter((link) => link.isLink)
            .map((link) => ({
              text: link.value,
              index: link.start,
              data: link,
            })),
        type: this.type,
        getAttributes: (match, pasteEvent) => {
          const html = pasteEvent?.clipboardData?.getData("text/html");
          const hrefRegex = /href="([^"]*)"/;

          const existingLink = html?.match(hrefRegex);

          if (existingLink) {
            return {
              href: existingLink[1],
            };
          }

          return {
            href: match.data?.href,
          };
        },
      }),
    ];
  },

  addProseMirrorPlugins() {
    const plugins: Plugin[] = [];

    if (this.options.autolink) {
      plugins.push(
        autolink({
          type: this.type,
          validate: this.options.validate,
        })
      );
    }

    if (this.options.openOnClick) {
      plugins.push(
        clickHandler({
          type: this.type,
        })
      );
    }

    if (this.options.linkOnPaste) {
      plugins.push(
        pasteHandler({
          editor: this.editor,
          type: this.type,
        })
      );
    }

    return plugins;
  },
});
