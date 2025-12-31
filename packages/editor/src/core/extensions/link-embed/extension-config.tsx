import { mergeAttributes, Node } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";

export const LinkEmbedExtensionConfig = Node.create({
  name: CORE_EXTENSIONS.LINK_EMBED,
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      url: {
        default: null,
      },
      title: {
        default: null,
      },
      description: {
        default: null,
      },
      image: {
        default: null,
      },
      favicon: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "link-embed-component",
        getAttrs: (element) => {
          if (typeof element === "string") return {};
          return {
            url: element.getAttribute("data-url"),
            title: element.getAttribute("data-title"),
            description: element.getAttribute("data-description"),
            image: element.getAttribute("data-image"),
            favicon: element.getAttribute("data-favicon"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "link-embed-component",
      mergeAttributes(HTMLAttributes, {
        "data-url": HTMLAttributes.url,
        "data-title": HTMLAttributes.title,
        "data-description": HTMLAttributes.description,
        "data-image": HTMLAttributes.image,
        "data-favicon": HTMLAttributes.favicon,
      }),
    ];
  },
});
