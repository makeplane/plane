import type { PasteRuleMatch } from "@tiptap/core";
import { Mark, markPasteRule, mergeAttributes } from "@tiptap/core";
import type { Plugin } from "@tiptap/pm/state";
import { find, registerCustomProtocol, reset } from "linkifyjs";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { isValidHttpUrl } from "@/helpers/common";
// local imports
import { autolink } from "./helpers/autolink";
import { clickHandler } from "./helpers/clickHandler";
import { pasteHandler } from "./helpers/pasteHandler";

type LinkProtocolOptions = {
  scheme: string;
  optionalSlashes?: boolean;
};

type LinkOptions = {
  /**
   * If enabled, it adds links as you type.
   */
  autolink: boolean;
  /**
   * An array of custom protocols to be registered with linkifyjs.
   */
  protocols: Array<LinkProtocolOptions | string>;
  /**
   * If enabled, links will be opened on click.
   */
  openOnClick: boolean;
  /**
   * If enabled, links will be inclusive i.e. if you move your cursor to the
   * link text, and start typing, it'll be a part of the link itself.
   */
  inclusive: boolean;
  /**
   * Adds a link to the current selection if the pasted content only contains an url.
   */
  linkOnPaste: boolean;
  /**
   * A list of HTML attributes to be rendered.
   */
  HTMLAttributes: Record<string, unknown>;
  /**
   * A validation function that modifies link verification for the auto linker.
   * @param url - The url to be validated.
   * @returns - True if the url is valid, false otherwise.
   */
  validate?: (url: string) => boolean;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.CUSTOM_LINK]: {
      /**
       * Set a link mark
       */
      setLink: (attributes: {
        href: string;
        target?: string | null;
        rel?: string | null;
        class?: string | null;
      }) => ReturnType;
      /**
       * Toggle a link mark
       */
      toggleLink: (attributes: {
        href: string;
        target?: string | null;
        rel?: string | null;
        class?: string | null;
      }) => ReturnType;
      /**
       * Unset a link mark
       */
      unsetLink: () => ReturnType;
    };
  }
  interface Storage {
    [CORE_EXTENSIONS.CUSTOM_LINK]: CustomLinkStorage;
  }
}

export type CustomLinkStorage = {
  isPreviewOpen: boolean;
  posToInsert: { from: number; to: number };
  isBubbleMenuOpen: boolean;
};

export const CustomLinkExtension = Mark.create<LinkOptions, CustomLinkStorage>({
  name: CORE_EXTENSIONS.CUSTOM_LINK,

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
      protocols: ["http", "https"],
      HTMLAttributes: {
        target: "_blank",
        rel: "noopener noreferrer nofollow",
        class:
          "text-accent-secondary underline underline-offset-[3px] hover:text-accent-primary transition-colors cursor-pointer",
      },
      validate: (url: string) => isValidHttpUrl(url).isValid,
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
          if (typeof node === "string") {
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
        find: (text) => {
          const foundLinks: PasteRuleMatch[] = [];

          if (text) {
            const links = find(text).filter((item) => item.isLink);

            if (links.length) {
              links.forEach((link) =>
                foundLinks.push({
                  text: link.value,
                  data: {
                    href: link.href,
                  },
                  index: link.start,
                })
              );
            }
          }

          return foundLinks;
        },
        type: this.type,
        getAttributes: (match) => ({
          href: match.data?.href,
        }),
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

  addStorage() {
    return {
      isPreviewOpen: false,
      isBubbleMenuOpen: false,
      posToInsert: { from: 0, to: 0 },
    };
  },
});
